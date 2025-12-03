use std::path::Path;

use serde_json::Value;
use unity_yaml_rust::Yaml;

pub fn check_os() -> String {
    let os = std::env::consts::OS;
    match os {
        "windows" => "win".into(),
        "linux" => "linux".into(),
        _ => "unknown".into(),
    }
}

pub fn get_asset_ripper() -> Option<String> {
    let os = check_os();

    if os == "unknown" {
        return None;
    }

    let dir = format!(
        "{}/binaries/asset-ripper/{}-x64/AssetRipper.GUI.Free{}",
        std::env::current_dir().unwrap().display(),
        os,
        if os == "windows" { ".exe" } else { "" }
    );
    Some(dir)
}

#[tauri::command]
pub async fn get_app_versions(app_name: String) -> Result<Vec<String>, String> {
    use std::process::Command;

    println!("[Versions] Getting versions for app: {}", app_name);

    // Use external apkeep binary instead of library to avoid GLib-GIO issues
    const APKEEP_BINARY: &str = if cfg!(target_os = "windows") {
        "./binaries/apkeep.exe"
    } else {
        "./binaries/apkeep"
    };

    // Build apkeep command to list versions
    let mut cmd = Command::new(APKEEP_BINARY);
    cmd.arg("-a").arg(&app_name).arg("-l");

    println!("[Versions] Executing command: {:?}", cmd);

    // Execute apkeep command without timeout
    let versions_future = tokio::task::spawn_blocking(move || {
        cmd.output()
            .map_err(|e| format!("Failed to execute apkeep: {}", e))
            .and_then(|output| {
                if output.status.success() {
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    println!("[Versions] Command output: {}", stdout);

                    // Parse versions from output - join all lines and extract versions
                    let full_text = stdout.replace('\n', " ");
                    let versions: Vec<String> = if let Some(start) = full_text.find("| ") {
                        let versions_part = &full_text[start + 2..]; // Remove "| "
                        versions_part
                            .split(", ")
                            .map(|v| v.trim().to_string())
                            .filter(|v| {
                                !v.is_empty()
                                    && v.chars().any(|c| c.is_numeric())
                                    && !v.contains("Versions")
                                    && !v.contains("available")
                            })
                            .collect()
                    } else {
                        Vec::new()
                    };

                    println!("[Versions] Found {} versions", versions.len());
                    Ok(versions)
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    println!(
                        "[Versions] Command failed. Stdout: {}, Stderr: {}",
                        stdout, stderr
                    );
                    Err(format!("Failed to get versions: {}", stderr))
                }
            })
    });

    match versions_future.await {
        Ok(Ok(versions)) => {
            println!("[Versions] Successfully got {} versions", versions.len());
            Ok(versions)
        }
        Ok(Err(e)) => {
            println!("[Versions] Error: {}", e);
            Err(e)
        }
        Err(e) => {
            println!("[Versions] Task join error: {}", e);
            Err(format!("Task execution failed: {}", e))
        }
    }
}

#[tauri::command]
pub async fn download_app(
    app_name: String,
    version: Option<String>,
    out_path: String,
) -> Result<bool, String> {
    use std::process::Command;

    println!(
        "[Download] Starting download for app: {}, version: {:?}, path: {}",
        app_name, version, out_path
    );

    // Validate output path
    let out_path_buf = std::path::PathBuf::from(&out_path);
    if let Some(parent) = out_path_buf.parent() {
        if !parent.exists() {
            return Err(format!(
                "Output directory does not exist: {}",
                parent.display()
            ));
        }
    }

    // Use external apkeep binary instead of library to avoid GLib-GIO issues
    const APKEEP_BINARY: &str = if cfg!(target_os = "windows") {
        "./binaries/apkeep.exe"
    } else {
        "./binaries/apkeep"
    };

    // Build apkeep command
    let mut cmd = Command::new(APKEEP_BINARY);
    cmd.arg("-a");
    
    if let Some(v) = version {
        // Use app_id@version format
        cmd.arg(format!("{}@{}", app_name, v));
    } else {
        cmd.arg(&app_name);
    }

    cmd.arg(&out_path);

    println!("[Download] Executing command: {:?}", cmd);

    // Execute apkeep command without timeout - let it run until completion or error
    let download_future = tokio::task::spawn_blocking(move || {
        cmd.output()
            .map_err(|e| format!("Failed to execute apkeep: {}", e))
            .and_then(|output| {
                if output.status.success() {
                    println!("[Download] Command executed successfully");
                    Ok(())
                } else {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    println!(
                        "[Download] Command failed. Stdout: {}, Stderr: {}",
                        stdout, stderr
                    );
                    Err(format!("Download failed: {}", stderr))
                }
            })
    });

    // Wait for completion without timeout
    match download_future.await {
        Ok(Ok(_)) => {
            println!("[Download] Download completed successfully");
            Ok(true)
        }
        Ok(Err(e)) => {
            println!("[Download] Download error: {}", e);
            Err(e)
        }
        Err(e) => {
            println!("[Download] Task join error: {}", e);
            Err(format!("Task execution failed: {}", e))
        }
    }
}

#[tauri::command]
pub fn check_asset_ripper() -> bool {
    if let Some(path) = get_asset_ripper() {
        if Path::new(&path).exists() {
            let execute = std::process::Command::new(&path)
                .arg("--help")
                .spawn()
                .is_ok();
            if execute {
                return true;
            }
            return false;
        }
    }
    false
}

#[tauri::command]
pub fn check_is_directory(path: String) -> bool {
    Path::new(&path).is_dir()
}

#[tauri::command]
pub fn read_directory(path: String) -> Result<Vec<String>, String> {
    use std::fs;

    match fs::read_dir(&path) {
        Ok(entries) => {
            let mut result = Vec::new();
            for entry in entries {
                match entry {
                    Ok(entry) => {
                        if let Some(name) = entry.file_name().to_str() {
                            result.push(name.to_string());
                        }
                    }
                    Err(e) => return Err(format!("Error reading entry: {}", e)),
                }
            }
            Ok(result)
        }
        Err(e) => Err(format!("Error reading directory {}: {}", path, e)),
    }
}

#[tauri::command]
pub fn read_file_as_bytes(path: String) -> Result<Vec<u8>, String> {
    use std::fs;

    fs::read(&path).map_err(|e| format!("Error reading file {}: {}", path, e))
}

#[tauri::command]
pub fn read_text_file(path: String) -> Result<String, String> {
    use std::fs;

    fs::read_to_string(&path).map_err(|e| format!("Error reading text file {}: {}", path, e))
}

#[tauri::command]
pub fn crop_image_from_bytes(
    image_bytes: Vec<u8>,
    x: u32,
    y: u32,
    width: u32,
    height: u32,
) -> Result<Vec<u8>, String> {
    use image::{ImageBuffer, ImageFormat, RgbaImage};
    use std::io::Cursor;

    println!(
        "[Crop] Input - x:{}, unity_y:{}, width:{}, height:{}",
        x, y, width, height
    );

    // Load image from bytes with high quality
    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;

    // Convert to RGBA with 8-bit per channel for maximum quality
    let rgba_img = img.to_rgba8();

    // Get image dimensions
    let (img_width, img_height) = rgba_img.dimensions();

    // Validate crop region bounds
    if x >= img_width || y >= img_height || width == 0 || height == 0 {
        return Err(format!(
            "Invalid crop region: x:{}, y:{}, width:{}, height:{} for image ({}x{})",
            x, y, width, height, img_width, img_height
        ));
    }

    if y.checked_add(height).map_or(true, |sum| sum > img_height) {
        return Err(format!(
            "Crop region exceeds image height: y:{} + height:{} > img_height:{}",
            y, height, img_height
        ));
    }

    // Convert Unity Y coordinate (bottom-up) to image Y coordinate (top-down)
    // Unity Y starts from bottom, image Y starts from top
    // Since we've already checked that y + height <= img_height, this subtraction is safe
    let image_y = img_height - y - height;

    println!(
        "[Crop] Image dimensions: {}x{}, converted image_y: {}",
        img_width, img_height, image_y
    );

    // Check bounds with converted coordinates (we've already checked basic bounds above)
    // This is a secondary check for the converted image_y coordinate
    if x + width > img_width {
        return Err(format!(
            "Crop width exceeds image bounds: x:{} + width:{} = {} > img_width:{}",
            x,
            width,
            x + width,
            img_width
        ));
    }

    // Since image_y is calculated as img_height - y - height and we've verified
    // that y + height <= img_height, image_y should be >= 0 and valid
    // But let's add a safety check anyway
    if image_y + height > img_height {
        return Err(format!(
            "Internal error: converted crop bounds exceed image height. image_y:{} + height:{} = {} > img_height:{}",
            image_y, height, image_y + height, img_height
        ));
    }

    // Create new image for cropped area with high quality
    let mut cropped: RgbaImage = ImageBuffer::new(width, height);

    // Copy pixels using converted Y coordinate with exact pixel copying
    // This preserves the original pixel values without any interpolation
    for py in 0..height {
        for px in 0..width {
            let pixel = rgba_img.get_pixel(x + px, image_y + py);
            cropped.put_pixel(px, py, *pixel);
        }
    }

    // Convert to high-quality PNG bytes
    let mut png_bytes = Vec::new();
    {
        let mut cursor = Cursor::new(&mut png_bytes);

        // Use high-quality PNG encoding
        cropped
            .write_to(&mut cursor, ImageFormat::Png)
            .map_err(|e| format!("Failed to encode high-quality PNG: {}", e))?;
    }

    println!(
        "[Crop] Successfully created high-quality cropped image: {}x{}, size: {} bytes",
        width,
        height,
        png_bytes.len()
    );

    Ok(png_bytes)
}

#[tauri::command]
pub fn optimize_image_bytes(image_bytes: Vec<u8>) -> Result<Vec<u8>, String> {
    use image::ImageFormat;
    use std::io::Cursor;

    println!(
        "[Optimize] Optimizing image, input size: {} bytes",
        image_bytes.len()
    );

    // Load image from bytes
    let img = image::load_from_memory(&image_bytes)
        .map_err(|e| format!("Failed to load image: {}", e))?;

    // Convert to RGBA8 for consistent high quality
    let rgba_img = img.to_rgba8();
    let (width, height) = rgba_img.dimensions();

    println!("[Optimize] Image dimensions: {}x{}", width, height);

    // Convert to high-quality PNG bytes
    let mut png_bytes = Vec::new();
    {
        let mut cursor = Cursor::new(&mut png_bytes);

        // Use high-quality PNG encoding
        rgba_img
            .write_to(&mut cursor, ImageFormat::Png)
            .map_err(|e| format!("Failed to encode high-quality PNG: {}", e))?;
    }

    println!(
        "[Optimize] Successfully optimized image: {}x{}, input: {} bytes -> output: {} bytes",
        width,
        height,
        image_bytes.len(),
        png_bytes.len()
    );

    Ok(png_bytes)
}

#[tauri::command]
pub fn parse_asset_file(asset_content: String) -> Result<AssetCropInfo, String> {
    // Parse Unity asset file to extract crop coordinates
    // This is a simplified parser - Unity asset files are complex

    println!(
        "[Asset] Parsing asset file, content length: {}",
        asset_content.len()
    );

    // Look for sprite data patterns
    let lines: Vec<&str> = asset_content.lines().collect();
    let mut x = 0u32;
    let mut y = 0u32;
    let mut width = 0u32;
    let mut height = 0u32;

    for (i, line) in lines.iter().enumerate() {
        let trimmed = line.trim();

        // Look for rect data pattern
        if trimmed.contains("m_Rect:") || trimmed.contains("rect:") {
            println!("[Asset] Found rect pattern at line {}: {}", i, trimmed);

            // Try to find x, y, width, height in the next few lines
            for j in 1..10 {
                if i + j >= lines.len() {
                    break;
                }
                let next_line = lines[i + j].trim();

                if next_line.starts_with("x:") {
                    x = parse_float_from_line(next_line).unwrap_or(0.0) as u32;
                    println!("[Asset] Found x: {}", x);
                } else if next_line.starts_with("y:") {
                    y = parse_float_from_line(next_line).unwrap_or(0.0) as u32;
                    println!("[Asset] Found y: {}", y);
                } else if next_line.starts_with("width:") {
                    width = parse_float_from_line(next_line).unwrap_or(0.0) as u32;
                    println!("[Asset] Found width: {}", width);
                } else if next_line.starts_with("height:") {
                    height = parse_float_from_line(next_line).unwrap_or(0.0) as u32;
                    println!("[Asset] Found height: {}", height);
                    break; // Found all values
                }
            }
        }
    }

    if width == 0 || height == 0 {
        return Err("Could not parse sprite dimensions from asset file".to_string());
    }

    println!(
        "[Asset] Final parsed values - x:{}, y:{}, width:{}, height:{}",
        x, y, width, height
    );

    Ok(AssetCropInfo {
        x,
        y,
        width,
        height,
    })
}

// Helper function to parse float from a line like "x: 123.456"
fn parse_float_from_line(line: &str) -> Option<f32> {
    line.split(':').nth(1)?.trim().parse::<f32>().ok()
}

#[derive(serde::Serialize)]
pub struct AssetCropInfo {
    pub x: u32,
    pub y: u32,
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
pub async fn export_hero_avatar(
    base64_data: String,
    hero_name: String,
    output_dir: String,
) -> Result<String, String> {
    use base64::{engine::general_purpose, Engine as _};
    use std::fs;

    println!("[Export] Exporting hero avatar: {}", hero_name);

    // Parse base64 data (remove data:image/png;base64, prefix if present)
    let base64_clean = if base64_data.starts_with("data:image/png;base64,") {
        &base64_data[22..]
    } else {
        &base64_data
    };

    // Decode base64 to bytes
    let image_bytes = general_purpose::STANDARD
        .decode(base64_clean)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Create output directory if it doesn't exist
    fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    // Generate filename (sanitize hero name for filesystem)
    let sanitized_name: String = hero_name
        .chars()
        .map(|c| match c {
            c if c.is_ascii_alphanumeric() || c == '-' || c == '_' => c,
            ' ' => '_',
            _ => '_',
        })
        .collect();

    let filename = format!("{}_avatar.png", sanitized_name);
    let output_path = format!("{}/{}", output_dir, filename);

    // Write image bytes to file
    fs::write(&output_path, image_bytes)
        .map_err(|e| format!("Failed to write image file: {}", e))?;

    println!("[Export] Successfully exported avatar to: {}", output_path);
    Ok(output_path)
}

#[tauri::command]
pub async fn export_hero_skin_image(
    base64_data: String,
    hero_name: String,
    skin_id: String,
    color_id: Option<String>,
    output_dir: String,
) -> Result<String, String> {
    use base64::{engine::general_purpose, Engine as _};
    use std::fs;

    let skin_info = if let Some(color) = color_id {
        format!("skin_{}_{}", skin_id, color)
    } else {
        format!("skin_{}", skin_id)
    };

    println!(
        "[Export] Exporting hero skin image: {} - {}",
        hero_name, skin_info
    );

    // Parse base64 data (remove data:image/png;base64, prefix if present)
    let base64_clean = if base64_data.starts_with("data:image/png;base64,") {
        &base64_data[22..]
    } else {
        &base64_data
    };

    // Decode base64 to bytes
    let image_bytes = general_purpose::STANDARD
        .decode(base64_clean)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Create output directory if it doesn't exist
    fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    // Generate filename (sanitize hero name for filesystem)
    let sanitized_name: String = hero_name
        .chars()
        .map(|c| match c {
            c if c.is_ascii_alphanumeric() || c == '-' || c == '_' => c,
            ' ' => '_',
            _ => '_',
        })
        .collect();

    let filename = format!("{}_{}.png", sanitized_name, skin_info);
    let output_path = format!("{}/{}", output_dir, filename);

    // Write image bytes to file
    fs::write(&output_path, image_bytes)
        .map_err(|e| format!("Failed to write image file: {}", e))?;

    println!(
        "[Export] Successfully exported skin image to: {}",
        output_path
    );
    Ok(output_path)
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct BulkExportHero {
    pub id: String,
    pub name: String,
    pub avatar: Option<String>,
    pub skins: Option<Vec<BulkExportSkin>>,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct BulkExportSkin {
    pub skin_id: String,
    pub color_id: Option<String>,
    pub image_data: String,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ExportProgress {
    pub current_hero: String,
    pub current_hero_index: usize,
    pub total_heroes: usize,
    pub current_item: String,
    pub current_item_index: usize,
    pub total_items: usize,
    pub completed: bool,
    pub error: Option<String>,
}

#[tauri::command]
pub async fn export_heroes_bulk(
    heroes: Vec<BulkExportHero>,
    output_dir: String,
    include_avatars: bool,
    include_skins: bool,
) -> Result<Vec<String>, String> {
    use base64::{engine::general_purpose, Engine as _};
    use std::fs;

    println!(
        "[Bulk Export] Starting bulk export for {} heroes to: {}",
        heroes.len(),
        output_dir
    );

    // Create main output directory
    fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Failed to create output directory: {}", e))?;

    let mut exported_paths = Vec::new();
    let total_heroes = heroes.len();

    for (hero_index, hero) in heroes.iter().enumerate() {
        println!(
            "[Bulk Export] Processing hero {}/{}: {} ({})",
            hero_index + 1,
            total_heroes,
            hero.name,
            hero.id
        );

        // Sanitize hero name for filesystem
        let sanitized_name: String = hero
            .name
            .chars()
            .map(|c| match c {
                c if c.is_ascii_alphanumeric() || c == '-' || c == '_' => c,
                ' ' => '_',
                _ => '_',
            })
            .collect();

        // Create hero-specific directory
        let hero_dir = format!("{}/{}_{}", output_dir, sanitized_name, hero.id);
        fs::create_dir_all(&hero_dir)
            .map_err(|e| format!("Failed to create hero directory: {}", e))?;

        // Export avatar if requested and available
        if include_avatars {
            if let Some(avatar_data) = &hero.avatar {
                let base64_clean = if avatar_data.starts_with("data:image/png;base64,") {
                    &avatar_data[22..]
                } else {
                    avatar_data
                };

                match general_purpose::STANDARD.decode(base64_clean) {
                    Ok(image_bytes) => {
                        let avatar_filename = format!("{}_avatar.png", sanitized_name);
                        let avatar_path = format!("{}/{}", hero_dir, avatar_filename);

                        match fs::write(&avatar_path, image_bytes) {
                            Ok(_) => {
                                println!("[Bulk Export] Exported avatar: {}", avatar_path);
                                exported_paths.push(avatar_path);
                            }
                            Err(e) => {
                                println!(
                                    "[Bulk Export] Failed to write avatar for {}: {}",
                                    hero.name, e
                                );
                            }
                        }
                    }
                    Err(e) => {
                        println!(
                            "[Bulk Export] Failed to decode avatar for {}: {}",
                            hero.name, e
                        );
                    }
                }
            }
        }

        // Export skins if requested and available
        if include_skins {
            if let Some(skins) = &hero.skins {
                for skin in skins {
                    let base64_clean = if skin.image_data.starts_with("data:image/png;base64,") {
                        &skin.image_data[22..]
                    } else {
                        &skin.image_data
                    };

                    match general_purpose::STANDARD.decode(base64_clean) {
                        Ok(image_bytes) => {
                            let skin_info = if let Some(color) = &skin.color_id {
                                format!("skin_{}_{}", skin.skin_id, color)
                            } else {
                                format!("skin_{}", skin.skin_id)
                            };

                            let skin_filename = format!("{}_{}.png", sanitized_name, skin_info);
                            let skin_path = format!("{}/{}", hero_dir, skin_filename);

                            match fs::write(&skin_path, image_bytes) {
                                Ok(_) => {
                                    println!("[Bulk Export] Exported skin: {}", skin_path);
                                    exported_paths.push(skin_path);
                                }
                                Err(e) => {
                                    println!(
                                        "[Bulk Export] Failed to write skin for {}: {}",
                                        hero.name, e
                                    );
                                }
                            }
                        }
                        Err(e) => {
                            println!(
                                "[Bulk Export] Failed to decode skin for {}: {}",
                                hero.name, e
                            );
                        }
                    }
                }
            }
        }
    }

    println!(
        "[Bulk Export] Completed bulk export. Exported {} files",
        exported_paths.len()
    );

    Ok(exported_paths)
}

pub fn yaml_to_json(yaml: &Yaml) -> Result<Value, String> {
    match yaml {
        Yaml::Real(s) => s.parse::<f64>().map(Value::from).map_err(|e| e.to_string()),
        Yaml::Integer(i) => Ok(Value::from(*i)),
        Yaml::String(s) => Ok(Value::from(s.clone())),
        Yaml::Boolean(b) => Ok(Value::from(*b)),
        Yaml::Array(arr) => {
            let json_arr: Result<Vec<Value>, _> = arr.iter().map(yaml_to_json).collect();
            json_arr.map(Value::from)
        }
        Yaml::Hash(hash) => {
            let mut json_obj = serde_json::Map::new();
            for (key, value) in hash.iter() {
                let key_str = match key {
                    Yaml::String(s) => s.clone(),
                    _ => format!("{:?}", key),
                };
                json_obj.insert(key_str, yaml_to_json(value)?);
            }
            Ok(Value::Object(json_obj))
        }
        Yaml::Alias(_) => Err("YAML aliases not supported".to_string()),
        Yaml::Null => Ok(Value::Null),
        Yaml::BadValue => Err("Bad YAML value".to_string()),
        Yaml::Original(_) => Err("Original YAML value not supported".to_string()),
    }
}
