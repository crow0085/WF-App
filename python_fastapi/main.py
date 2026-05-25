import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from rapidocr_onnxruntime import RapidOCR
from rapidfuzz import process, utils, fuzz 

app = FastAPI()
engine = RapidOCR()


CACHED_TRADABLE_ITEMS: List[str] = []


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/init-items")
async def initialize_item_list(items: List[str]):
    global CACHED_TRADABLE_ITEMS
    if not items:
        raise HTTPException(status_code=400, detail="Provided item list cannot be empty.")
    
    CACHED_TRADABLE_ITEMS = items
    print(f"Successfully cached {len(CACHED_TRADABLE_ITEMS)} tradable items in memory.")
    return {
        "status": "success",
        "message": f"Successfully initialized {len(CACHED_TRADABLE_ITEMS)} items."
    }

@app.get("/")
async def root_health_check():
    return {
        "status": "online",
        "message": "FastAPI is running!",
        "items_loaded": len(CACHED_TRADABLE_ITEMS) > 0
    }

def group_multiline_text(ocr_items, max_vertical_gap=45, horizontal_tolerance=30):
    """
    Stitches multi-line stacked text blocks by comparing their 
    horizontal overlap and vertical proximity, allowing for slight box overlaps.
    """
    grouped_items = []
    used_indices = set()

    ocr_items.sort(key=lambda x: x["bounding_box"][0][1])

    for i in range(len(ocr_items)):
        if i in used_indices:
            continue

        current = ocr_items[i]
        curr_box = current["bounding_box"]
        
        x1, y1 = curr_box[0][0], curr_box[0][1]
        x2, y2 = curr_box[2][0], curr_box[2][1]
        
        combined_text = current["text"]
        matched_any = True
        
        while matched_any:
            matched_any = False
            for j in range(i + 1, len(ocr_items)):
                if j in used_indices:
                    continue

                next_item = ocr_items[j]
                next_box = next_item["bounding_box"]
                nx1, ny1 = next_box[0][0], next_box[0][1]
                nx2, ny2 = next_box[2][0], next_box[2][1]

                is_below = -15 <= (ny1 - y2) <= max_vertical_gap
                
                curr_center_x = (x1 + x2) / 2
                next_center_x = (nx1 + nx2) / 2
                is_aligned = abs(curr_center_x - next_center_x) <= horizontal_tolerance

                if is_below and is_aligned:
                    combined_text += f" {next_item['text']}"
                    x1 = min(x1, nx1)
                    x2 = max(x2, nx2)
                    y2 = max(y2, ny2)
                    
                    used_indices.add(j)
                    matched_any = True
                    break 

        grouped_items.append({
            "text": combined_text,
            "confidence": current["confidence"],
            "bounding_box": [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]
        })
        used_indices.add(i)

    return grouped_items


@app.get("/api/items-from-img/{img_path:path}")
async def get_items(img_path: str):
    global CACHED_TRADABLE_ITEMS
    
    # Safety fallback rule check
    if not CACHED_TRADABLE_ITEMS:
        raise HTTPException(
            status_code=400, 
            detail="The item cache is empty. Please run POST /api/init-items first."
        )

    if not img_path.startswith("/"):
        img_path = "/" + img_path

    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="File not found")

    result, _ = engine(img_path)
    if result is None:
        return {"status": "success", "items": []}

    raw_items = []
    for box, text, confidence in result:
        text_upper = text.strip().upper()
        if float(confidence) > 0.4 and text_upper not in ["SEARCH...", "SELECT ITEMS FROM YOUR", "INVENTORY TO SELL", "TOTAL", "SELL ITEMS", "ONLY SELLABLE", "EXIT", "TUTORIAL", "FILTER", "PRIME PARTS"]:
            raw_items.append({
                "text": text.strip(),
                "confidence": float(confidence),
                "bounding_box": box
            })

    grouped_items = group_multiline_text(raw_items)
    final_verified_items = []

    for item in grouped_items:
        ocr_text = item["text"]
        
        search_candidates = CACHED_TRADABLE_ITEMS
        ocr_lower = ocr_text.lower()
        
        if "prime" in ocr_lower:
            search_candidates = [x for x in search_candidates if "prime" in x.lower()]
        elif len(ocr_text) > 2:
            first_char = ocr_lower[0]
            search_candidates = [x for x in search_candidates if x.lower().startswith(first_char)]
        # -------------------------------

        match = process.extractOne(
            ocr_text, 
            search_candidates if search_candidates else CACHED_TRADABLE_ITEMS, 
            processor=utils.default_process,
            scorer=fuzz.ratio,
            score_cutoff=80.0
        )
        
        if match:
            verified_name, score, _ = match
            final_verified_items.append({
                "raw_ocr_text": ocr_text,
                "verified_name": verified_name,
                "match_confidence": round(score, 2),
                "bounding_box": item["bounding_box"]
            })

    final_verified_items.sort(key=lambda x: x["verified_name"])

    return {
        "status": "success",
        "items": final_verified_items
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8008, reload=True)