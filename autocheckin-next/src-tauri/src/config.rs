use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::AppHandle;
use tauri::Manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Location {
    pub lat: String,
    pub lng: String,
    pub acc: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub id: String, // Added ID for easier management
    pub name: String,
    pub time: String, // HH:MM
    pub class_id: String,
    pub cookie: String,
    pub location: Location,
    pub enable: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WeComConfig {
    pub enable: bool,
    pub corpid: String,
    pub secret: String,
    pub agentid: String,
    pub touser: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GlobalConfig {
    pub wecom: WeComConfig,
    pub debug: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub tasks: Vec<Task>,
    pub global: GlobalConfig,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            tasks: vec![],
            global: GlobalConfig {
                wecom: WeComConfig {
                    enable: false,
                    corpid: "".to_string(),
                    secret: "".to_string(),
                    agentid: "".to_string(),
                    touser: "@all".to_string(),
                },
                debug: false,
            },
        }
    }
}

pub struct ConfigState(pub Mutex<AppConfig>);

pub fn get_config_path(app_handle: &AppHandle) -> PathBuf {
    app_handle
        .path()
        .app_config_dir()
        .expect("failed to get app config dir")
        .join("config.json")
}

pub fn load_config(app_handle: &AppHandle) -> AppConfig {
    let config_path = get_config_path(app_handle);
    if config_path.exists() {
        let content = fs::read_to_string(config_path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        AppConfig::default()
    }
}

pub fn save_config(app_handle: &AppHandle, config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_path(app_handle);
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(config_path, content).map_err(|e| e.to_string())?;
    Ok(())
}
