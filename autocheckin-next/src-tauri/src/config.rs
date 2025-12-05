use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::AppHandle;
use tauri::Manager;

/// Represents a geographical location.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Location {
    /// Latitude as a string.
    pub lat: String,
    /// Longitude as a string.
    pub lng: String,
    /// Accuracy of the location.
    pub acc: String,
}

/// Represents a scheduled task for auto-checkin.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    /// Unique identifier for the task.
    pub id: String,
    /// Name of the task.
    pub name: String,
    /// Scheduled time in HH:MM format.
    pub time: String,
    /// ID of the class to check in.
    pub class_id: String,
    /// Authentication cookie for the session.
    pub cookie: String,
    /// Location data for the check-in.
    pub location: Location,
    /// Whether the task is enabled.
    pub enable: bool,
}

/// Configuration for WeCom (Work WeChat) integration.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct WeComConfig {
    /// Whether WeCom notifications are enabled.
    pub enable: bool,
    /// The CorpID of the WeCom enterprise.
    pub corpid: String,
    /// The Secret for the WeCom application.
    pub secret: String,
    /// The AgentID of the WeCom application.
    pub agentid: String,
    /// The user(s) to send notifications to (e.g., "@all").
    pub touser: String,
}

/// Global configuration settings for the application.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GlobalConfig {
    /// WeCom configuration settings.
    pub wecom: WeComConfig,
    /// Whether debug mode is enabled.
    pub debug: bool,
}

/// Root configuration structure for the application.
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    /// List of scheduled tasks.
    pub tasks: Vec<Task>,
    /// Global application settings.
    pub global: GlobalConfig,
}

impl Default for AppConfig {
    /// Creates a default `AppConfig` with empty tasks and disabled WeCom integration.
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

/// State wrapper for `AppConfig` to allow sharing across threads safely using a Mutex.
pub struct ConfigState(pub Mutex<AppConfig>);

/// Retrieves the path to the configuration file.
///
/// # Arguments
///
/// * `app_handle` - Handle to the Tauri application.
///
/// # Returns
///
/// * `PathBuf` - The path to the `config.json` file in the app's configuration directory.
pub fn get_config_path(app_handle: &AppHandle) -> PathBuf {
    app_handle
        .path()
        .app_config_dir()
        .expect("failed to get app config dir")
        .join("config.json")
}

/// Loads the application configuration from the file system.
///
/// If the configuration file exists, it reads and parses it.
/// Otherwise, it returns the default configuration.
///
/// # Arguments
///
/// * `app_handle` - Handle to the Tauri application.
///
/// # Returns
///
/// * `AppConfig` - The loaded or default configuration.
pub fn load_config(app_handle: &AppHandle) -> AppConfig {
    let config_path = get_config_path(app_handle);
    if config_path.exists() {
        let content = fs::read_to_string(config_path).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_default()
    } else {
        AppConfig::default()
    }
}

/// Saves the application configuration to the file system.
///
/// Creates the parent directory if it doesn't exist, and writes the configuration
/// as a pretty-printed JSON string.
///
/// # Arguments
///
/// * `app_handle` - Handle to the Tauri application.
/// * `config` - The configuration to save.
///
/// # Returns
///
/// * `Result<(), String>` - Ok if successful, or an error message string on failure.
pub fn save_config(app_handle: &AppHandle, config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_path(app_handle);
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(config_path, content).map_err(|e| e.to_string())?;
    Ok(())
}
