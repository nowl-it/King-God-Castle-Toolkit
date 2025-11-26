mod c2u;
mod file_watcher;
mod logger;
mod set_app_title;
mod unity;
mod utils;

use crate::unity::prefab::prefab_hierarchy;
use c2u::{
    c2u,
};
use file_watcher::{create_watcher_state, *};
use logger::{clear_old_logs, ensure_log_directory, get_recent_logs, write_log_entry};
use set_app_title::set_app_title;
use utils::*;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(create_watcher_state())
        .invoke_handler(tauri::generate_handler![
            get_app_versions,
            download_app,
            check_asset_ripper,
            c2u,
            set_app_title,
            check_path_exists,
            check_is_directory,
            read_directory,
            read_file_as_bytes,
            read_text_file,
            crop_image_from_bytes,
            optimize_image_bytes,
            parse_asset_file,
            get_file_tree,
            start_watching,
            stop_watching,
            get_file_info,
            read_file_content,
            open_in_system,
            select_project_folder,
            export_hero_avatar,
            export_hero_skin_image,
            export_heroes_bulk,
            ensure_log_directory,
            write_log_entry,
            get_recent_logs,
            clear_old_logs,
            prefab_hierarchy,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
