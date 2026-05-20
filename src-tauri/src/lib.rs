use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime};
use tauri::{AppHandle, Manager};

#[derive(serde::Deserialize)]
struct JsDelivrVersion {
    version: String,
}

// MODIFIED: Now filters specifically for items ending in "Intact"
fn clean_relic_data(full_data: serde_json::Value) -> serde_json::Value {
    if let Some(items_array) = full_data.as_array() {
        let mut unique_items = Vec::new();

        for item in items_array {
            // Check specifically for the "name" field at the root of the relic object
            // The provided image shows "name": "Axi A1 Intact" directly in the array
            if let Some(name_val) = item.get("name").and_then(|n| n.as_str()) {
                
                // Check if the name ends with "Intact" (case insensitive for safety)
                if name_val.to_lowercase().ends_with("intact") {
                    unique_items.push(item.clone());
                }
            } else {
                // Optional: If an item has no name field at all, we can skip it 
                // or add the logic here if you want to keep them.
                // For safety, skipping unknown items is usually best.
            }
        }

        serde_json::Value::Array(unique_items)
    } else {
        full_data
    }
}

fn process_category_data(category: &str, raw_json_str: &str) -> Result<serde_json::Value, String> {
    // 1. Parse raw text into basic JSON structure
    let full_data: serde_json::Value = serde_json::from_str(raw_json_str)
        .map_err(|e| format!("Failed to parse raw data string to JSON: {}", e))?;

    // 2. Route the data to the appropriate cleaner based on the requested category
    match category {
        "Relics" => Ok(clean_relic_data(full_data)),
        
        // "Weapons" => Ok(clean_weapon_data(full_data)), // Easy to add later!
        
        _ => Ok(full_data), // Default fallback: If it doesn't need special cleaning, send it as-is
    }
}

#[tauri::command]
async fn get_warframe_items(
    app: AppHandle, 
    category: String, 
    force_fetch: Option<bool> // optional arg to re fetch the data before its been 24h
) -> Result<serde_json::Value, String> {
    // 1. Establish path to the OS App Cache directory (e.g., AppData/Local/cache on Windows)
    let cache_dir: PathBuf = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    
    // Ensure the folder structure exists physically on the drive
    fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    
    let file_path = cache_dir.join(format!("{}.json", category));

    // 2. Check if the file exists and evaluate its age
    let mut use_cache = false;
    let a_day_in_seconds = 24 * 60 * 60;

    let should_force = force_fetch.unwrap_or(false);

    if !should_force && file_path.exists() {
        if let Ok(metadata) = fs::metadata(&file_path) {
            if let Ok(modified) = metadata.modified() {
                if let Ok(duration) = SystemTime::now().duration_since(modified) {
                    // Check if the local file is under 24 hours old (86,400 seconds)
                    if duration.as_secs() < a_day_in_seconds {
                        use_cache = true;
                    }
                }
            }
        }
    }

    // 3. Return the cached data if it is valid
    if use_cache {
        let cache_content = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
        println!("Cached data found and fresh!");
        let processed_cache = process_category_data(&category, &cache_content)?;
        return Ok(processed_cache);
    }

    // 4. Fetch live data if the cache is missing or expired
    let client = reqwest::Client::builder()
        .user_agent("WF-APP (GitHub: crow0085)")
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    // Fetch the real-time version from jsDelivr metadata registry
    let version_url = "https://data.jsdelivr.com/v1/packages/npm/@wfcd/items/resolved";
    
    let response = client
        .get(version_url)
        .send()
        .await
        .map_err(|e| format!("Network request failed: {}", e))?;

    // Extract and parse the JSON payload into our struct
    let version_data = response
        .json::<JsDelivrVersion>()
        .await
        .map_err(|e| format!("Failed to parse version JSON: {}", e))?;

    // Now you can access the string cleanly!
    let active_version: String = version_data.version;

    // Build the path using the dynamically retrieved version string
    let data_url = format!(
        "https://cdn.jsdelivr.net/npm/@wfcd/items@{}/data/json/{}.json",
        active_version, category
    );

    // Fetch the target category JSON payload
    let response = client
        .get(&data_url)
        .send()
        .await
        .map_err(|e| format!("Network request failed: {}", e))?;

    let fresh_json = response
        .text()
        .await
        .map_err(|e| format!("Failed to read network response text: {}", e))?;


    // Parse, process, and filter it out for React all in one go
    let processed_data = process_category_data(&category, &fresh_json)?;
    
    //Cache the parsed data to disk immediately
    fs::write(&file_path, &fresh_json)
        .map_err(|e| format!("Failed to save data cache to disk: {}", e))?;
    println!("Wrote {:?} data to file! {:?}", category, file_path);    
    
    // 3. Return the filtered dataset
    Ok(processed_data)
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. Force compositing off ONLY on Linux to prevent Wayland protocol crashes
    #[cfg(target_os = "linux")]
    std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_warframe_items])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

        
}
