use std::fs;
use std::path::PathBuf;
use std::time::{SystemTime};
use tauri::{AppHandle, Manager};
use serde_json::{Value, Map};

#[derive(serde::Deserialize)]
struct JsDelivrVersion {
    version: String,
}

#[tauri::command]
async fn merge_json_files(app: AppHandle) -> Result<serde_json::Value, String> {
    // 1. Establish path to the cache directory
    let cache_dir: PathBuf = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    let output_path = cache_dir.join("master.json");

    // 2. Check if master.json exists and evaluate its age (under 24 hours)
    let mut use_cached_master = false;
    let a_day_in_seconds = 24 * 60 * 60;

    if output_path.exists() {
        if let Ok(metadata) = fs::metadata(&output_path) {
            if let Ok(modified) = metadata.modified() {
                if let Ok(duration) = SystemTime::now().duration_since(modified) {
                    if duration.as_secs() < a_day_in_seconds {
                        use_cached_master = true;
                    }
                }
            }
        }
    }

    // 3. Return the cached master data immediately if it's fresh
    if use_cached_master {
        println!("Master JSON cache found and fresh! Returning cached file.");
        let cached_content = fs::read_to_string(&output_path).map_err(|e| e.to_string())?;
        let master_json: Value = serde_json::from_str(&cached_content)
            .map_err(|e| format!("Failed to parse existing master.json: {}", e))?;
        return Ok(master_json);
    }

    // 4. Stale or non-existent: Gather and merge individual JSON files
    println!("Master JSON is stale or missing. Rebuilding master map...");
    let mut master_obj = Map::new();
    let entries = fs::read_dir(&cache_dir)
        .map_err(|e| format!("Failed to read cache directory {}: {}", cache_dir.display(), e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Directory entry error: {}", e))?;
        let path = entry.path();

        // Only process files ending in `.json`
        if path.is_file() && path.extension().map_or(false, |ext| ext == "json") {
            if let Some(file_name) = path.file_stem().and_then(|s| s.to_str()) {
                // Ignore the current master.json during the merge loop
                if file_name == "master" {
                    continue; 
                }

                let content = fs::read_to_string(&path)
                    .map_err(|e| format!("Failed to read {}.json: {}", file_name, e))?;
                
                let json_value: Value = serde_json::from_str(&content)
                    .map_err(|e| format!("Malformed JSON in {}.json: {}", file_name, e))?;

                master_obj.insert(file_name.to_string(), json_value);
            }
        }
    }

    let master_value = Value::Object(master_obj);

    // 5. Serialize and cache the newly merged data to disk
    let pretty_json = serde_json::to_string_pretty(&master_value)
        .map_err(|e| format!("Failed to serialize master JSON: {}", e))?;
        
    fs::write(&output_path, pretty_json)
        .map_err(|e| format!("Failed to write master.json to disk: {}", e))?;
    
    println!("Wrote new master.json data to disk!");

    // 6. Return the fresh master object to the frontend state
    Ok(master_value)
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
async fn get_plat_value(
    client: tauri::State<'_, reqwest::Client>,
    url: String
    
) -> Result<serde_json::Value, String> {

    // 2. Make the asynchronous GET request
    let response = client.get(&url)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    // 3. Parse the body directly into a generic JSON Value
    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| e.to_string())?;

    Ok(json)
}

#[tauri::command]
async fn get_warframe_items(
    app: tauri::AppHandle, 
    client: tauri::State<'_, reqwest::Client>,
    category: String, 
    force_fetch: Option<bool>
) -> Result<String, String> {
    // 1. Establish path to the OS App Cache directory
    let cache_dir: std::path::PathBuf = app.path().app_cache_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&cache_dir).map_err(|e| e.to_string())?;
    let file_path = cache_dir.join(format!("{}.json", category));

    // 2. Check if the file exists and evaluate its age
    let mut use_cache = false;
    let a_day_in_seconds = 24 * 60 * 60;
    let should_force = force_fetch.unwrap_or(false);

    if !should_force && file_path.exists() {
        if let Ok(metadata) = fs::metadata(&file_path) {
            if let Ok(modified) = metadata.modified() {
                if let Ok(duration) = std::time::SystemTime::now().duration_since(modified) {
                    if duration.as_secs() < a_day_in_seconds {
                        use_cache = true;
                    }
                }
            }
        }
    }

    // 3. If cache is fresh, do nothing and return status
    if use_cache {
        println!("Cached data for {} found and fresh!", category);
        return Ok(format!("Cache fresh for category: {}", category));
    }

    // 4. Cache is stale/missing: Fetch real-time version from jsDelivr registry
    let version_url = "https://data.jsdelivr.com/v1/packages/npm/@wfcd/items/resolved";
    let response = client
        .get(version_url)
        .send()
        .await
        .map_err(|e| format!("Network request failed: {}", e))?;

    let version_data = response
        .json::<JsDelivrVersion>() // Ensure your JsDelivrVersion struct is in scope
        .await
        .map_err(|e| format!("Failed to parse version JSON: {}", e))?;

    let active_version = version_data.version;
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

    // 5. CRITICAL CHANGE: Parse and CLEAN the data BEFORE saving it to disk
    let processed_data = process_category_data(&category, &fresh_json)?;
    
    // Serialize the CLEANED data back to a string format to write to disk
    let cleaned_json_str = serde_json::to_string_pretty(&processed_data)
        .map_err(|e| format!("Failed to serialize cleaned JSON: {}", e))?;

    // Cache the CLEANED data to disk immediately
    fs::write(&file_path, cleaned_json_str)
        .map_err(|e| format!("Failed to save data cache to disk: {}", e))?;
        
    println!("Wrote CLEANED {:?} data to file! {:?}", category, file_path);    
    
    Ok(format!("Successfully downloaded and cleaned category: {}", category))
}


#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. Force compositing off ONLY on Linux to prevent Wayland protocol crashes
    #[cfg(target_os = "linux")]
    std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    
    let client = reqwest::Client::builder()
        .user_agent("WF-APP (GitHub: crow0085)")
        .build()
        .expect("Failed to build global HTTP client");

    tauri::Builder::default()
        .manage(client)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![get_warframe_items, get_plat_value, merge_json_files])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

        
}
