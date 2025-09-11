use std::path::Path;

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
        "binaries/asset-ripper-{}-x64/AssetRipper.GUI.Free{}",
        os,
        if os == "windows" { ".exe" } else { "" }
    );
    Some(dir)
}

#[tauri::command]
pub async fn get_app_versions(app_name: String) -> Result<Vec<String>, String> {
    use std::process::Command;
    use std::time::Duration;

    println!("[Versions] Getting versions for app: {}", app_name);

    // Use external apkeep binary instead of library to avoid GLib-GIO issues
    let apkeep_binary = if cfg!(target_os = "windows") {
        "./binaries/apkeep.exe"
    } else {
        "./binaries/apkeep"
    };

    // Build apkeep command to list versions
    let mut cmd = Command::new(apkeep_binary);
    cmd.arg("-a").arg(&app_name).arg("-l");

    println!("[Versions] Executing command: {:?}", cmd);

    // Add timeout to prevent hanging
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

    match tokio::time::timeout(Duration::from_secs(30), versions_future).await {
        Ok(Ok(Ok(versions))) => {
            println!("[Versions] Successfully got {} versions", versions.len());
            Ok(versions)
        }
        Ok(Ok(Err(e))) => {
            println!("[Versions] Error: {}", e);
            Err(e)
        }
        Ok(Err(e)) => {
            println!("[Versions] Task join error: {}", e);
            Err(format!("Task execution failed: {}", e))
        }
        Err(_) => {
            println!("[Versions] Timeout after 30 seconds");
            Err("Request timeout - check your internet connection".to_string())
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
    use std::time::Duration;

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
    let apkeep_binary = if cfg!(target_os = "windows") {
        "./binaries/apkeep.exe"
    } else {
        "./binaries/apkeep"
    };

    // Build apkeep command
    let mut cmd = Command::new(apkeep_binary);

    if let Some(ref v) = version {
        // Use app_id@version format
        let app_with_version = format!("{}@{}", app_name, v);
        cmd.arg("-a").arg(&app_with_version);
    } else {
        cmd.arg("-a").arg(&app_name);
    }

    cmd.arg(&out_path);

    println!("[Download] Executing command: {:?}", cmd);

    // Single attempt download with timeout
    const TIMEOUT_SECONDS: u64 = 300; // 5 minutes timeout

    // Execute with timeout using tokio
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

    // Apply timeout to prevent hanging
    match tokio::time::timeout(Duration::from_secs(TIMEOUT_SECONDS), download_future).await {
        Ok(Ok(Ok(_))) => {
            println!("[Download] Download completed successfully");
            Ok(true)
        }
        Ok(Ok(Err(e))) => {
            println!("[Download] Download error: {}", e);
            Err(e)
        }
        Ok(Err(e)) => {
            println!("[Download] Task join error: {}", e);
            Err(format!("Task execution failed: {}", e))
        }
        Err(_) => {
            println!(
                "[Download] Download timeout after {} seconds",
                TIMEOUT_SECONDS
            );
            Err(format!(
                "Download timeout after {} minutes",
                TIMEOUT_SECONDS / 60
            ))
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

    // Check if the crop region is within bounds before any calculations
    if x >= img_width || y >= img_height || width == 0 || height == 0 {
        return Err(format!(
            "Invalid crop region: x:{}, y:{}, width:{}, height:{} for image dimensions ({}x{})",
            x, y, width, height, img_width, img_height
        ));
    }

    // Check if y + height would exceed image height (prevent overflow)
    if y + height > img_height {
        return Err(format!(
            "Crop region exceeds image height: y:{} + height:{} = {} > img_height:{}",
            y,
            height,
            y + height,
            img_height
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
