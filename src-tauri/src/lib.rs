mod auth;
mod backup_manager;
mod instances;
mod launcher;
mod modrinth;
mod skin;
mod utils;

use std::fs;
use std::path::{Path, PathBuf};
use serde::{Serialize, Deserialize};
use tauri::AppHandle;
use tauri::Manager;

#[derive(Serialize)]
struct FileEntry {
    name: String,
    path: String,
    is_dir: bool,
    size: u64,
}

fn extensions_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let path = app.path().app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?
        .join("extensions");
    fs::create_dir_all(&path).map_err(|e| format!("Failed to create extensions dir: {}", e))?;
    Ok(path)
}

#[derive(Serialize, Deserialize)]
struct ExtensionManifest {
    id: Option<String>,
    name: Option<String>,
    version: Option<String>,
}

#[derive(Serialize)]
struct ExtensionEntry {
    id: String,
    name: String,
    version: String,
    enabled: bool,
    path: String,
}

#[tauri::command]
fn get_extensions(app: AppHandle) -> Result<Vec<ExtensionEntry>, String> {
    let dir = extensions_dir(&app)?;
    let mut extensions = Vec::new();

    for entry in fs::read_dir(&dir).map_err(|e| format!("Failed to read extensions: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        let file_name = entry.file_name().to_string_lossy().to_string();

        if path.extension().map(|e| e == "luxextension").unwrap_or(false)
            || path.extension().map(|e| e == "zip").unwrap_or(false)
        {
            let id = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
            extensions.push(ExtensionEntry {
                id: id.clone(),
                name: id,
                version: "1.0.0".to_string(),
                enabled: true,
                path: path.to_string_lossy().to_string(),
            });
        }
    }

    Ok(extensions)
}

#[tauri::command]
fn install_extension(app: AppHandle, source_path: String) -> Result<(), String> {
    let source = Path::new(&source_path);
    let dest_dir = extensions_dir(&app)?;

    if source.exists() {
        let file_name = source.file_name()
            .ok_or_else(|| "Invalid source path".to_string())?;
        let dest = dest_dir.join(file_name);
        fs::copy(source, &dest).map_err(|e| format!("Failed to copy extension: {}", e))?;
        return Ok(());
    }

    Err(format!("File not found: {}", source_path))
}

#[tauri::command]
fn install_extension_bytes(app: AppHandle, filename: String, data: Vec<u8>) -> Result<(), String> {
    let dest_dir = extensions_dir(&app)?;
    let dest = dest_dir.join(&filename);
    fs::write(&dest, &data).map_err(|e| format!("Failed to write extension: {}", e))?;
    Ok(())
}

#[tauri::command]
fn remove_extension(app: AppHandle, id: String) -> Result<(), String> {
    let dir = extensions_dir(&app)?;

    for entry in fs::read_dir(&dir).map_err(|e| format!("Failed to read extensions: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();
        let stem = path.file_stem().unwrap_or_default().to_string_lossy().to_string();

        if stem == id && path.extension().map(|e| e == "luxextension" || e == "zip").unwrap_or(false) {
            fs::remove_file(&path).map_err(|e| format!("Failed to remove extension: {}", e))?;
            return Ok(());
        }
    }

    Err(format!("Extension '{}' not found", id))
}

#[tauri::command]
fn list_directory(path_str: String) -> Result<Vec<FileEntry>, String> {
    let path = Path::new(&path_str);
    let mut entries = Vec::new();

    for entry in fs::read_dir(path).map_err(|e| format!("Failed to read directory: {}", e))? {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry.metadata().map_err(|e| format!("Failed to read metadata: {}", e))?;

        entries.push(FileEntry {
            name: entry.file_name().to_string_lossy().to_string(),
            path: entry.path().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
            size: metadata.len(),
        });
    }

    entries.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.cmp(&b.name)
        }
    });

    Ok(entries)
}

#[tauri::command]
fn get_home_dir() -> Result<String, String> {
    dirs::home_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not find home directory".to_string())
}

#[tauri::command]
fn relaunch(app: AppHandle) {
    app.restart();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_log::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            auth::login,
            auth::get_profile,
            backup_manager::manual_backup,
            instances::get_instances,
            launcher::launch_game,
            get_extensions,
            install_extension,
            install_extension_bytes,
            remove_extension,
            list_directory,
            get_home_dir,
            relaunch,
            modrinth::search_modrinth,
            modrinth::get_modrinth_project,
            modrinth::get_mod_versions,
            modrinth::resolve_dependencies,
            modrinth::modrinth_install,
            instances::get_server_mods,
            skin::get_current_skin,
            skin::save_local_skin,
            skin::save_local_skin_from_url,
            skin::save_local_skin_from_username,
            skin::upload_skin,
            skin::upload_skin_from_url,
            skin::get_local_skins
        ])
        .setup(|_app| Ok(()))
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
