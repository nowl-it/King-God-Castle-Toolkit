use tauri::Runtime;

#[tauri::command]
pub async fn set_app_title<R: Runtime>(
    _app: tauri::AppHandle<R>,
    window: tauri::Window<R>,
    title: String,
) -> Result<(), String> {
    window
        .set_title(&title)
        .map_err(|e| format!("Failed to set title: {}", e))?;
    Ok(())
}
