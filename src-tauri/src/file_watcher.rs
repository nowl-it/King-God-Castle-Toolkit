// src-tauri/src/file_watcher.rs
use notify::{Event, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::boxed::Box;
use std::future::Future;
use std::path::Path;
use std::pin::Pin;
use std::sync::{mpsc, Arc, Mutex};
use std::thread;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_dialog::DialogExt;
use tokio::fs;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileNode {
    pub name: String,
    pub path: String,
    pub is_directory: bool,
    pub children: Option<Vec<FileNode>>,
    pub size: Option<u64>,
    pub modified: Option<String>,
}

#[derive(Debug, Serialize, Clone)]
pub struct FileSystemEvent {
    pub event_type: String,
    pub path: String,
    pub tree: FileNode,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FsEvent {
    paths: Vec<String>,
    kind: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct FileInfo {
    name: String,
    path: String,
    size: u64,
    is_file: bool,
    modified: Option<u64>,
}

pub type WatcherState = Arc<Mutex<Option<notify::RecommendedWatcher>>>;

pub fn create_watcher_state() -> WatcherState {
    Arc::new(Mutex::new(None))
}

fn read_dir_recursive(
    dir_path: &str,
) -> Pin<Box<dyn Future<Output = std::io::Result<FileNode>> + Send + '_>> {
    Box::pin(async move {
        let path = Path::new(dir_path);
        let metadata = fs::metadata(path).await?;

        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        if metadata.is_file() {
            return Ok(FileNode {
                name,
                path: dir_path.to_string(),
                is_directory: false,
                children: None,
                size: Some(metadata.len()),
                modified: metadata
                    .modified()
                    .ok()
                    .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                    .map(|d| d.as_secs().to_string()),
            });
        }

        let mut children = Vec::new();
        let mut entries = fs::read_dir(path).await?;

        while let Some(entry) = entries.next_entry().await? {
            let entry_path = entry.path();
            let entry_path_str = entry_path.to_string_lossy().to_string();

            match read_dir_recursive(&entry_path_str).await {
                Ok(child_node) => children.push(child_node),
                Err(_) => continue,
            }
        }

        children.sort_by(|a, b| match (a.is_directory, b.is_directory) {
            (true, false) => std::cmp::Ordering::Less,
            (false, true) => std::cmp::Ordering::Greater,
            _ => a.name.cmp(&b.name),
        });

        Ok(FileNode {
            name,
            path: dir_path.to_string(),
            is_directory: true,
            children: Some(children),
            size: None,
            modified: metadata
                .modified()
                .ok()
                .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                .map(|d| d.as_secs().to_string()),
        })
    })
}

#[tauri::command]
pub async fn start_watching(
    path: String,
    app_handle: AppHandle,
    state: State<'_, WatcherState>,
) -> Result<(), String> {
    let watcher_state = state.inner();
    stop_watching_internal(&state).await?;

    let (tx, rx) = mpsc::channel::<Result<Event, notify::Error>>();

    let mut watcher = notify::recommended_watcher(move |res| {
        let _ = tx.send(res);
    })
    .map_err(|e| e.to_string())?;

    watcher
        .watch(Path::new(&path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    {
        let mut w = watcher_state.lock().unwrap();
        *w = Some(watcher);
    }

    let app_handle_clone = app_handle.clone();
    thread::spawn(move || {
        for res in rx {
            match res {
                Ok(event) => {
                    let paths: Vec<String> = event
                        .paths
                        .iter()
                        .map(|p| p.to_string_lossy().to_string())
                        .collect();

                    let fs_event = FsEvent {
                        paths,
                        kind: format!("{:?}", event.kind),
                    };

                    if app_handle_clone.emit("fs-changed", &fs_event).is_err() {
                        break;
                    }
                }
                Err(_) => break,
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub async fn stop_watching(state: State<'_, WatcherState>) -> Result<(), String> {
    stop_watching_internal(&state).await
}

async fn stop_watching_internal(state: &State<'_, WatcherState>) -> Result<(), String> {
    let watcher_state = state.inner();
    let mut w = watcher_state.lock().unwrap();

    if let Some(_watcher) = w.take() {
        // Watcher will be dropped automatically
    }

    Ok(())
}

#[tauri::command]
pub async fn get_file_tree(
    path: String,
    _state: State<'_, WatcherState>,
) -> Result<FileNode, String> {
    read_dir_recursive(&path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_path_exists(path: String) -> Result<bool, String> {
    Ok(Path::new(&path).exists())
}

#[tauri::command]
pub async fn get_file_info(file_path: String) -> Result<FileInfo, String> {
    let metadata = fs::metadata(&file_path).await.map_err(|e| e.to_string())?;

    let name = Path::new(&file_path)
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs());

    Ok(FileInfo {
        name,
        path: file_path,
        size: metadata.len(),
        is_file: metadata.is_file(),
        modified,
    })
}

#[tauri::command]
pub async fn read_file_content(path: String) -> Result<String, String> {
    let mut buffer = vec![0; 1024];
    let file = fs::File::open(&path).await.map_err(|e| e.to_string())?;
    let mut reader = tokio::io::BufReader::new(file);

    use tokio::io::AsyncReadExt;
    let bytes_read = reader.read(&mut buffer).await.map_err(|e| e.to_string())?;

    if buffer[..bytes_read].contains(&0) {
        return Err("Binary file cannot be displayed as text".to_string());
    }

    fs::read_to_string(&path).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn open_in_system(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub async fn select_project_folder(app_handle: tauri::AppHandle) -> Result<Option<String>, String> {
    let dialog = app_handle.dialog().file().add_filter("Folders", &[]);

    match dialog.blocking_pick_folder() {
        Some(path) => Ok(Some(path.to_string())),
        None => Ok(None),
    }
}
