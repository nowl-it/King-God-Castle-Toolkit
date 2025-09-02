use std::path::{ Path, PathBuf };
use std::fs::{ self, File };
use std::process::Command;
use apkeep::download_sources;
use zip::ZipArchive;
use std::io;

fn check_os() -> String {
	let os = std::env::consts::OS;
	match os {
		"windows" => "win".into(),
		"linux" => "linux".into(),
		_ => "unknown".into(),
	}
}

#[tauri::command]
async fn get_app_versions(app_name: String) -> Result<Vec<String>, String> {
	let apps = vec![(app_name, None)];
	let versions = download_sources::apkpure::list_versions(apps).await;
	match versions {
		Ok(v) => Ok(v.into_iter().next().unwrap_or_default().1),
		Err(e) => Err(format!("Error getting versions: {}", e)),
	}
}

#[tauri::command]
async fn download_app(app_name: String, version: Option<String>, out_path: &str) -> Result<bool, String> {
	let apps = vec![(app_name, version)];
	let out_path = Path::new(out_path).to_owned();

	tokio::task
		::spawn_blocking(move || {
			let rt = tokio::runtime::Runtime::new().map_err(|e| format!("Failed to create runtime: {}", e))?;

			rt.block_on(async {
				let result = download_sources::apkpure
					::download_apps(apps, 4, 0, &out_path).await
					.map_err(|e| format!("Error downloading app: {}", e));

				match result {
					Ok(_) => Ok(true),
					Err(e) => Err(format!("Error downloading app: {}", e)),
				}
			})
		}).await
		.map_err(|e| format!("Task join error: {}", e))?
}

fn get_asset_ripper() -> Option<String> {
	let os = check_os();

	if os == "unknown" {
		return None;
	}

	let dir = format!("binaries/asset-ripper-{}-x64/AssetRipper.GUI.Free{}", os, if os == "windows" {
		".exe"
	} else {
		""
	});
	Some(dir)
}

#[tauri::command]
fn check_asset_ripper() -> bool {
	if let Some(path) = get_asset_ripper() {
		if Path::new(&path).exists() {
			let execute = std::process::Command::new(&path).arg("--help").spawn().is_ok();
			if execute {
				return true;
			}
			return false;
		}
	}
	false
}

#[tauri::command]
async fn c2u(app_path: String, out_path: String) -> Result<(), String> {
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
	let file_name = app_path.file_stem().ok_or("Không thể lấy tên file")?.to_string_lossy();

	let version = file_name.split('@').nth(1).ok_or("Tên file không đúng định dạng <app_id>@<version>.xapk")?;

	// Tạo thư mục output theo version
	let output_path = base_output_path.join(version);
	if output_path.exists() {
		fs::remove_dir_all(&output_path).map_err(|e| format!("Không thể xóa thư mục output cũ: {}", e))?;
	}
	fs::create_dir_all(&output_path).map_err(|e| format!("Không thể tạo thư mục output: {}", e))?;

	// Tạo thư mục tạm để xử lý
	let temp_dir = output_path.join("temp_processing");
	fs::create_dir_all(&temp_dir).map_err(|e| format!("Không thể tạo thư mục tạm: {}", e))?;

	// Bước 1: Giải nén file XAPK
	println!("Đang giải nén file XAPK...");
	extract_zip(&app_path, &temp_dir)?;

	// Bước 2: Tìm và giữ lại chỉ base_assets.apk và config.*.apk
	println!("Đang lọc các file cần thiết...");
	let mut base_assets_path: Option<PathBuf> = None;
	let mut config_apks: Vec<PathBuf> = Vec::new();

	// Đọc tất cả files trong thư mục tạm
	let entries = fs::read_dir(&temp_dir).map_err(|e| format!("Không thể đọc thư mục tạm: {}", e))?;

	for entry in entries {
		let entry = entry.map_err(|e| format!("Lỗi đọc entry: {}", e))?;
		let file_path = entry.path();
		if !file_path.is_file() {
			continue;
		}

		let file_name = file_path.file_name().unwrap().to_string_lossy();

		if file_name == "base_assets.apk" || file_name == "base.apk" {
			base_assets_path = Some(file_path);
		} else if file_name.starts_with("config.") && file_name.ends_with(".apk") {
			config_apks.push(file_path);
		}
	}

	// Kiểm tra có tìm thấy base_assets.apk không
	let base_assets = base_assets_path.ok_or("Không tìm thấy base_assets.apk hoặc base.apk")?;

	// Xóa tất cả files khác
	let entries = fs::read_dir(&temp_dir).map_err(|e| format!("Không thể đọc thư mục tạm lần 2: {}", e))?;
	for entry in entries {
		let entry = entry.map_err(|e| format!("Lỗi đọc entry lần 2: {}", e))?;
		let file_path = entry.path();
		let file_name = file_path.file_name().unwrap().to_string_lossy();

		let should_keep =
			file_name == "base_assets.apk" ||
			file_name == "base.apk" ||
			(file_name.starts_with("config.") && file_name.ends_with(".apk"));

		if !should_keep {
			if file_path.is_dir() {
				fs::remove_dir_all(&file_path).map_err(|e| format!("Không thể xóa thư mục {}: {}", file_name, e))?;
			} else {
				fs::remove_file(&file_path).map_err(|e| format!("Không thể xóa file {}: {}", file_name, e))?;
			}
		}
	}

	// Bước 3: Giải nén base_assets.apk
	println!("Đang giải nén base_assets.apk...");
	let base_assets_dir = temp_dir.join("base_assets");
	fs::create_dir_all(&base_assets_dir).map_err(|e| format!("Không thể tạo thư mục base_assets: {}", e))?;
	extract_zip(&base_assets, &base_assets_dir)?;

	// Bước 4: Giải nén các config.*.apk và di chuyển lib folder
	for config_apk in config_apks {
		println!("Đang xử lý {:?}...", config_apk.file_name().unwrap());
		let config_dir = temp_dir.join("config_temp");

		// Tạo thư mục tạm cho config
		if config_dir.exists() {
			fs::remove_dir_all(&config_dir).map_err(|e| format!("Không thể xóa config_temp: {}", e))?;
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
	let entries = fs::read_dir(&temp_dir).map_err(|e| format!("Không thể đọc thư mục tạm lần 3: {}", e))?;
	for entry in entries {
		let entry = entry.map_err(|e| format!("Lỗi đọc entry lần 3: {}", e))?;
		let file_path = entry.path();
		let file_name = file_path.file_name().unwrap().to_string_lossy();

		if file_name != "base_assets" {
			if file_path.is_dir() {
				fs::remove_dir_all(&file_path).map_err(|e| format!("Không thể xóa thư mục {}: {}", file_name, e))?;
			} else {
				fs::remove_file(&file_path).map_err(|e| format!("Không thể xóa file {}: {}", file_name, e))?;
			}
		}
	}

	// Bước 6: Chạy AssetRipper với base_assets làm input
	println!("Đang chạy AssetRipper...");
	let final_output_dir = output_path;
	fs::create_dir_all(&final_output_dir).map_err(|e| format!("Không thể tạo thư mục output cuối: {}", e))?;

	let status = Command::new(get_asset_ripper().unwrap())
		.arg("--InputPath")
		.arg(&base_assets_dir)
		.arg("--OutputPath")
		.arg(&final_output_dir)
		.status()
		.map_err(|e| format!("Error running asset-ripper: {}", e))?;

	if !status.success() {
		return Err("AssetRipper failed.".into());
	}

	// Dọn dẹp thư mục tạm
	fs::remove_dir_all(&temp_dir).map_err(|e| format!("Không thể xóa thư mục tạm cuối: {}", e))?;

	println!("Hoàn thành! Kết quả được lưu tại: {:?}", final_output_dir);
	Ok(())
}

// Hàm hỗ trợ giải nén ZIP/APK sử dụng ZipArchive (đa nền tảng)
fn extract_zip(zip_path: &Path, extract_to: &Path) -> Result<(), String> {
	let file = File::open(zip_path).map_err(|e| format!("Không thể mở file zip: {}", e))?;
	let mut archive = ZipArchive::new(file).map_err(|e| format!("Không thể đọc archive: {}", e))?;

	for i in 0..archive.len() {
		let mut file = archive.by_index(i).map_err(|e| format!("Không thể truy cập file trong archive: {}", e))?;
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
					fs::create_dir_all(p).map_err(|e| format!("Không thể tạo thư mục cha: {}", e))?;
				}
			}

			let mut outfile = File::create(&outpath).map_err(|e| format!("Không thể tạo file output: {}", e))?;
			io::copy(&mut file, &mut outfile).map_err(|e| format!("Không thể copy file: {}", e))?;
		}

		// Thiết lập permissions trên Unix
		#[cfg(unix)]
		{
			use std::os::unix::fs::PermissionsExt;
			if let Some(mode) = file.unix_mode() {
				fs
					::set_permissions(&outpath, fs::Permissions::from_mode(mode))
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

	let entries = fs::read_dir(source).map_err(|e| format!("Không thể đọc thư mục source: {}", e))?;

	for entry in entries {
		let entry = entry.map_err(|e| format!("Lỗi đọc entry trong copy: {}", e))?;
		let source_path = entry.path();
		let file_name = source_path.file_name().unwrap();
		let target_path = target.join(file_name);

		if source_path.is_dir() {
			copy_dir_recursive(&source_path, &target_path)?;
		} else {
			fs::copy(&source_path, &target_path).map_err(|e| format!("Không thể copy file: {}", e))?;
		}
	}

	Ok(())
}

// Hàm hỗ trợ merge hai thư mục
fn merge_directories(source: &Path, target: &Path) -> Result<(), String> {
	let entries = fs::read_dir(source).map_err(|e| format!("Không thể đọc thư mục source: {}", e))?;

	for entry in entries {
		let entry = entry.map_err(|e| format!("Lỗi đọc entry trong merge: {}", e))?;
		let source_path = entry.path();
		let file_name = source_path.file_name().unwrap();
		let target_path = target.join(file_name);

		if source_path.is_dir() {
			// Nếu là thư mục, tạo và merge đệ quy
			if !target_path.exists() {
				fs::create_dir_all(&target_path).map_err(|e| format!("Không thể tạo thư mục target: {}", e))?;
			}
			merge_directories(&source_path, &target_path)?;
		} else {
			// Nếu là file, copy over (ghi đè nếu tồn tại)
			fs::copy(&source_path, &target_path).map_err(|e| format!("Không thể copy file: {}", e))?;
		}
	}

	Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
	tauri::Builder
		::default()
		.plugin(tauri_plugin_dialog::init())
		.invoke_handler(tauri::generate_handler![get_app_versions, download_app, check_asset_ripper, c2u])
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
