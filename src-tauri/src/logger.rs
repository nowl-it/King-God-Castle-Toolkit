use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct LogEntry {
    pub level: String,
    pub message: String,
    pub timestamp: String,
    pub context: String,
    pub data: String,
}

fn get_log_directory() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let home_dir = dirs::home_dir().ok_or("Cannot find home directory")?;
    let log_dir = home_dir.join(".kgc-toolkit").join("logs");
    Ok(log_dir)
}

fn get_current_date() -> String {
    chrono::Local::now().format("%Y-%m-%d").to_string()
}

fn get_log_file_path() -> Result<PathBuf, Box<dyn std::error::Error>> {
    let log_dir = get_log_directory()?;
    let date = get_current_date();
    let log_file = log_dir.join(format!("app-{}.log", date));
    Ok(log_file)
}

#[tauri::command]
pub async fn ensure_log_directory() -> Result<(), String> {
    let log_dir = get_log_directory().map_err(|e| e.to_string())?;

    if !log_dir.exists() {
        fs::create_dir_all(&log_dir)
            .map_err(|e| format!("Failed to create log directory: {}", e))?;
    }

    Ok(())
}

#[tauri::command]
pub async fn write_log_entry(entry: LogEntry) -> Result<(), String> {
    let log_file_path = get_log_file_path().map_err(|e| e.to_string())?;

    // Ensure the directory exists
    if let Some(parent) = log_file_path.parent() {
        if !parent.exists() {
            fs::create_dir_all(parent)
                .map_err(|e| format!("Failed to create log directory: {}", e))?;
        }
    }

    // Format log entry
    let log_line = format!(
        "[{}] [{}] {}{}: {}{}{}\n",
        entry.timestamp,
        entry.level.to_uppercase(),
        if entry.context.is_empty() { "" } else { "[" },
        if entry.context.is_empty() {
            ""
        } else {
            &entry.context
        },
        if entry.context.is_empty() { "" } else { "] " },
        entry.message,
        if entry.data.is_empty() {
            String::new()
        } else {
            format!(" | Data: {}", entry.data)
        }
    );

    // Write to file
    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file_path)
        .map_err(|e| format!("Failed to open log file: {}", e))?;

    file.write_all(log_line.as_bytes())
        .map_err(|e| format!("Failed to write to log file: {}", e))?;

    file.flush()
        .map_err(|e| format!("Failed to flush log file: {}", e))?;

    Ok(())
}

#[tauri::command]
pub async fn get_recent_logs(lines: Option<usize>) -> Result<Vec<String>, String> {
    let log_file_path = get_log_file_path().map_err(|e| e.to_string())?;

    if !log_file_path.exists() {
        return Ok(vec![]);
    }

    let content = fs::read_to_string(&log_file_path)
        .map_err(|e| format!("Failed to read log file: {}", e))?;

    let lines_limit = lines.unwrap_or(100);
    let log_lines: Vec<String> = content
        .lines()
        .rev()
        .take(lines_limit)
        .map(|s| s.to_string())
        .collect::<Vec<_>>()
        .into_iter()
        .rev()
        .collect();

    Ok(log_lines)
}

#[tauri::command]
pub async fn clear_old_logs(days_to_keep: Option<u64>) -> Result<u32, String> {
    let log_dir = get_log_directory().map_err(|e| e.to_string())?;
    let days = days_to_keep.unwrap_or(7);

    if !log_dir.exists() {
        return Ok(0);
    }

    let cutoff_date = chrono::Local::now() - chrono::Duration::days(days as i64);
    let mut deleted_count = 0;

    let entries =
        fs::read_dir(&log_dir).map_err(|e| format!("Failed to read log directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let path = entry.path();

        if let Some(file_name) = path.file_name().and_then(|n| n.to_str()) {
            if file_name.starts_with("app-") && file_name.ends_with(".log") {
                // Extract date from filename
                if let Some(date_str) = file_name
                    .strip_prefix("app-")
                    .and_then(|s| s.strip_suffix(".log"))
                {
                    if let Ok(file_date) = chrono::NaiveDate::parse_from_str(date_str, "%Y-%m-%d") {
                        if file_date < cutoff_date.date_naive() {
                            if let Err(e) = fs::remove_file(&path) {
                                eprintln!("Failed to delete old log file {:?}: {}", path, e);
                            } else {
                                deleted_count += 1;
                            }
                        }
                    }
                }
            }
        }
    }

    Ok(deleted_count)
}
