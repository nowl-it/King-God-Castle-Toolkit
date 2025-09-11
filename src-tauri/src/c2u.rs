use std::{
    fs::{self, File},
    io,
    path::{Path, PathBuf},
    process::Command,
};

use zip::ZipArchive;

use crate::get_asset_ripper;

#[tauri::command]
pub async fn c2u(app_path: String, out_path: String) -> Result<(), String> {
    #[cfg(unix)]
    {
        use rlimit::{setrlimit, Resource};
        match setrlimit(Resource::NOFILE, 16384, 16384) {
            Ok(_) => {
                if let Ok((curr, max)) = rlimit::getrlimit(Resource::NOFILE) {
                    println!("File limit set to: current = {}, max = {}", curr, max);
                }
            }
            Err(e) => return Err(format!("Failed to set file limit: {}", e)),
        }
    }

    let app_path = Path::new(&app_path).to_path_buf();
    let base_output_path = Path::new(&out_path).to_path_buf();

    // Kiểm tra file đầu vào
    if !app_path.exists() {
        return Err("File không tồn tại.".into());
    }

    // Kiểm tra thư mục đầu ra
    if !base_output_path.exists() {
        return Err("Thư mục lưu không tồn tại.".into());
    }

    // Trích xuất version từ tên file
    let file_name = app_path
        .file_stem()
        .ok_or("Không thể lấy tên file")?
        .to_string_lossy();

    let version = file_name
        .split('@')
        .nth(1)
        .ok_or("Tên file không đúng định dạng <app_id>@<version>.xapk")?;

    // Tạo thư mục output theo version
    let output_path = base_output_path.join(version);
    if output_path.exists() {
        fs::remove_dir_all(&output_path)
            .map_err(|e| format!("Không thể xóa thư mục output cũ: {}", e))?;
    }
    fs::create_dir_all(&output_path).map_err(|e| format!("Không thể tạo thư mục output: {}", e))?;

    // Tạo thư mục tạm để xử lý
    let temp_dir = output_path.join("temp");
    fs::create_dir_all(&temp_dir)
        .map_err(|e: io::Error| format!("Không thể tạo thư mục tạm: {}", e))?;

    // Bước 1: Giải nén file XAPK
    println!("Đang giải nén file XAPK...");
    extract_zip(&app_path, &temp_dir)?;

    // Bước 2: Tìm và phân loại các file APK
    println!("Đang lọc các file cần thiết...");
    let mut base_assets_path: Option<PathBuf> = None;
    let mut config_apks: Vec<PathBuf> = Vec::new();
    let mut all_apks: Vec<PathBuf> = Vec::new();

    // Đọc tất cả files trong thư mục tạm
    let entries =
        fs::read_dir(&temp_dir).map_err(|e| format!("Không thể đọc thư mục tạm: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Lỗi đọc entry: {}", e))?;
        let file_path = entry.path();
        if !file_path.is_file() {
            continue;
        }

        let file_name = file_path.file_name().unwrap().to_string_lossy();
        println!("Tìm thấy file: {}", file_name);

        if file_name.ends_with(".apk") {
            all_apks.push(file_path.clone());

            if file_name == "base_assets.apk" || file_name == "base.apk" {
                base_assets_path = Some(file_path);
            } else if file_name.starts_with("config.") && file_name.ends_with(".apk") {
                config_apks.push(file_path);
            }
        }
    }

    println!("Tìm thấy {} file APK", all_apks.len());
    for apk in &all_apks {
        println!("  - {}", apk.file_name().unwrap().to_string_lossy());
    }

    // Nếu không tìm thấy base_assets.apk hoặc base.apk, thử tìm APK lớn nhất
    let base_assets = if let Some(path) = base_assets_path {
        println!(
            "Sử dụng file base: {}",
            path.file_name().unwrap().to_string_lossy()
        );
        path
    } else if !all_apks.is_empty() {
        // Tìm APK lớn nhất (có thể là main APK)
        let largest_apk = all_apks
            .iter()
            .max_by_key(|apk| apk.metadata().map(|m| m.len()).unwrap_or(0))
            .ok_or("Không thể xác định APK chính")?;

        println!(
            "Không tìm thấy base_assets.apk hoặc base.apk, sử dụng APK lớn nhất: {}",
            largest_apk.file_name().unwrap().to_string_lossy()
        );
        largest_apk.clone()
    } else {
        return Err("Không tìm thấy file APK nào trong XAPK".to_string());
    };

    // Xóa tất cả files khác
    let entries =
        fs::read_dir(&temp_dir).map_err(|e| format!("Không thể đọc thư mục tạm lần 2: {}", e))?;
    for entry in entries {
        let entry = entry.map_err(|e| format!("Lỗi đọc entry lần 2: {}", e))?;
        let file_path = entry.path();
        let file_name = file_path.file_name().unwrap().to_string_lossy();

        let should_keep = file_name == "base_assets.apk"
            || file_name == "base.apk"
            || (file_name.starts_with("config.") && file_name.ends_with(".apk"));

        if !should_keep {
            if file_path.is_dir() {
                fs::remove_dir_all(&file_path)
                    .map_err(|e| format!("Không thể xóa thư mục {}: {}", file_name, e))?;
            } else {
                fs::remove_file(&file_path)
                    .map_err(|e| format!("Không thể xóa file {}: {}", file_name, e))?;
            }
        }
    }

    // Bước 3: Giải nén base_assets.apk
    println!("Đang giải nén base_assets.apk...");
    let base_assets_dir = temp_dir.join("base_assets");
    fs::create_dir_all(&base_assets_dir)
        .map_err(|e| format!("Không thể tạo thư mục base_assets: {}", e))?;
    extract_zip(&base_assets, &base_assets_dir)?;

    // Bước 4: Giải nén các config.*.apk và di chuyển lib folder
    for config_apk in config_apks {
        println!("Đang xử lý {:?}...", config_apk.file_name().unwrap());
        let config_dir = temp_dir.join("config_temp");

        // Tạo thư mục tạm cho config
        if config_dir.exists() {
            fs::remove_dir_all(&config_dir)
                .map_err(|e| format!("Không thể xóa config_temp: {}", e))?;
        }
        fs::create_dir_all(&config_dir).map_err(|e| format!("Không thể tạo config_temp: {}", e))?;

        // Giải nén config apk
        extract_zip(&config_apk, &config_dir)?;

        // Tìm và di chuyển thư mục lib
        let config_lib_dir = config_dir.join("lib");
        if config_lib_dir.exists() {
            let target_lib_dir = base_assets_dir.join("lib");

            // Nếu thư mục lib đã tồn tại trong base_assets, merge nội dung
            if target_lib_dir.exists() {
                merge_directories(&config_lib_dir, &target_lib_dir)?;
            } else {
                // Di chuyển toàn bộ thư mục lib
                copy_dir_recursive(&config_lib_dir, &target_lib_dir)?;
            }
        }

        // Xóa thư mục config tạm
        fs::remove_dir_all(&config_dir).map_err(|e| format!("Không thể xóa config_temp: {}", e))?;
    }

    // Bước 5: Xóa tất cả trừ folder base_assets
    let entries =
        fs::read_dir(&temp_dir).map_err(|e| format!("Không thể đọc thư mục tạm lần 3: {}", e))?;
    for entry in entries {
        let entry = entry.map_err(|e| format!("Lỗi đọc entry lần 3: {}", e))?;
        let file_path = entry.path();
        let file_name = file_path.file_name().unwrap().to_string_lossy();

        if file_name != "base_assets" {
            if file_path.is_dir() {
                fs::remove_dir_all(&file_path)
                    .map_err(|e| format!("Không thể xóa thư mục {}: {}", file_name, e))?;
            } else {
                fs::remove_file(&file_path)
                    .map_err(|e| format!("Không thể xóa file {}: {}", file_name, e))?;
            }
        }
    }

    // Bước 6: Chạy AssetRipper với base_assets làm input
    println!("Đang chạy AssetRipper...");
    let final_output_dir = output_path;
    fs::create_dir_all(&final_output_dir)
        .map_err(|e| format!("Không thể tạo thư mục output cuối: {}", e))?;

    // Chạy AssetRipper với timeout và memory limit awareness
    let asset_ripper_path = get_asset_ripper().ok_or("AssetRipper không tìm thấy")?;

    println!("Executing AssetRipper: {}", asset_ripper_path);
    println!("Input path: {:?}", base_assets_dir);
    println!("Output path: {:?}", final_output_dir);

    let mut cmd = Command::new(&asset_ripper_path);
    cmd.arg("--InputPath")
        .arg(&base_assets_dir)
        .arg("--OutputPath")
        .arg(&final_output_dir);

    println!("Command: {:?}", cmd); // Sử dụng spawn để có thể handle timeout
    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Error starting AssetRipper: {}", e))?;

    // Đợi process với timeout 10 phút
    use std::time::{Duration, Instant};
    let timeout = Duration::from_secs(600); // 10 minutes
    let start_time = Instant::now();

    loop {
        match child.try_wait() {
            Ok(Some(status)) => {
                println!("AssetRipper completed with status: {:?}", status);
                if !status.success() {
                    let error_detail = match status.code() {
                        Some(code) => format!("exit code: {}", code),
                        None => "terminated by signal".to_string(),
                    };
                    return Err(format!("AssetRipper failed with {}", error_detail));
                }
                break;
            }
            Ok(None) => {
                // Process still running, check timeout
                if start_time.elapsed() > timeout {
                    println!("AssetRipper timeout, killing process...");
                    let _ = child.kill();
                    let _ = child.wait();
                    return Err(
                        "AssetRipper timeout after 10 minutes - file quá lớn hoặc thiếu RAM"
                            .to_string(),
                    );
                }
                // Sleep a bit before checking again
                std::thread::sleep(Duration::from_secs(1));
            }
            Err(e) => {
                return Err(format!("Error waiting for AssetRipper: {}", e));
            }
        }
    }

    println!("Hoàn thành! Kết quả được lưu tại: {:?}", final_output_dir);
    Ok(())
}

// Hàm hỗ trợ giải nén ZIP/APK sử dụng ZipArchive (đa nền tảng)
fn extract_zip(zip_path: &Path, extract_to: &Path) -> Result<(), String> {
    let file = File::open(zip_path).map_err(|e| format!("Không thể mở file zip: {}", e))?;
    let mut archive = ZipArchive::new(file).map_err(|e| format!("Không thể đọc archive: {}", e))?;

    for i in 0..archive.len() {
        let mut file = archive
            .by_index(i)
            .map_err(|e| format!("Không thể truy cập file trong archive: {}", e))?;
        let outpath = match file.enclosed_name() {
            Some(path) => extract_to.join(path),
            None => {
                continue;
            }
        };

        if file.name().ends_with('/') {
            // Đây là thư mục
            fs::create_dir_all(&outpath).map_err(|e| format!("Không thể tạo thư mục: {}", e))?;
        } else {
            // Đây là file
            if let Some(p) = outpath.parent() {
                if !p.exists() {
                    fs::create_dir_all(p)
                        .map_err(|e| format!("Không thể tạo thư mục cha: {}", e))?;
                }
            }

            let mut outfile =
                File::create(&outpath).map_err(|e| format!("Không thể tạo file output: {}", e))?;
            io::copy(&mut file, &mut outfile).map_err(|e| format!("Không thể copy file: {}", e))?;
        }

        // Thiết lập permissions trên Unix
        #[cfg(unix)]
        {
            if let Some(mode) = file.unix_mode() {
                use std::os::unix::fs::PermissionsExt;

                fs::set_permissions(&outpath, fs::Permissions::from_mode(mode))
                    .map_err(|e| format!("Không thể set permissions: {}", e))?;
            }
        }
    }

    Ok(())
}

// Hàm hỗ trợ copy thư mục đệ quy (thay thế cho fs::rename để đa nền tảng)
fn copy_dir_recursive(source: &Path, target: &Path) -> Result<(), String> {
    if !target.exists() {
        fs::create_dir_all(target).map_err(|e| format!("Không thể tạo thư mục target: {}", e))?;
    }

    let entries =
        fs::read_dir(source).map_err(|e| format!("Không thể đọc thư mục source: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Lỗi đọc entry trong copy: {}", e))?;
        let source_path = entry.path();
        let file_name = source_path.file_name().unwrap();
        let target_path = target.join(file_name);

        if source_path.is_dir() {
            copy_dir_recursive(&source_path, &target_path)?;
        } else {
            fs::copy(&source_path, &target_path)
                .map_err(|e| format!("Không thể copy file: {}", e))?;
        }
    }

    Ok(())
}

// Hàm hỗ trợ merge hai thư mục
fn merge_directories(source: &Path, target: &Path) -> Result<(), String> {
    let entries =
        fs::read_dir(source).map_err(|e| format!("Không thể đọc thư mục source: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Lỗi đọc entry trong merge: {}", e))?;
        let source_path = entry.path();
        let file_name = source_path.file_name().unwrap();
        let target_path = target.join(file_name);

        if source_path.is_dir() {
            // Nếu là thư mục, tạo và merge đệ quy
            if !target_path.exists() {
                fs::create_dir_all(&target_path)
                    .map_err(|e| format!("Không thể tạo thư mục target: {}", e))?;
            }
            merge_directories(&source_path, &target_path)?;
        } else {
            // Nếu là file, copy over (ghi đè nếu tồn tại)
            fs::copy(&source_path, &target_path)
                .map_err(|e| format!("Không thể copy file: {}", e))?;
        }
    }

    Ok(())
}
