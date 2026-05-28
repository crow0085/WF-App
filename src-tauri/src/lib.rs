#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 1. Force compositing off ONLY on Linux to prevent Wayland protocol crashes
    #[cfg(target_os = "linux")]
    std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");

    // let client = reqwest::Client::builder()
    //     .user_agent("WF-APP (GitHub: crow0085)")
    //     .build()
    //     .expect("Failed to build global HTTP client");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_screenshots::init())
        .plugin(tauri_plugin_http::init())
        //.manage(client)
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
