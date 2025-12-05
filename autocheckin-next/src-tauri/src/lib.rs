mod auth;
mod config;
mod scheduler;
mod task;

use crate::auth::AuthHandler;
use crate::config::{load_config, save_config, AppConfig, ConfigState, Task};
use crate::scheduler::start_scheduler;
use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::{AppHandle, Manager, State};

// Commands

/// Tauri command to fetch a login QR code.
///
/// Uses `AuthHandler` to retrieve a QR code image (Base64 encoded) and a check URL.
///
/// # Returns
///
/// * `Result<(String, String), String>` - Base64 image and check URL, or an error message.
#[tauri::command]
fn get_login_qr() -> Result<(String, String), String> {
    let auth = AuthHandler::new();
    auth.get_qr_code()
}

/// Tauri command to check the status of a login attempt.
///
/// Polls the provided URL to see if the user has scanned the QR code and logged in.
///
/// # Arguments
///
/// * `url` - The check URL returned by `get_login_qr`.
///
/// # Returns
///
/// * `Result<Option<(String, String)>, String>` - Session info if successful, None if pending, or an error.
#[tauri::command]
fn check_login_status(url: String) -> Result<Option<(String, String)>, String> {
    let auth = AuthHandler::new();
    auth.check_login(&url)
}

/// Tauri command to retrieve the current application configuration.
///
/// # Arguments
///
/// * `app_handle` - The Tauri application handle.
///
/// # Returns
///
/// * `AppConfig` - The current configuration.
#[tauri::command]
fn get_config(app_handle: AppHandle) -> AppConfig {
    load_config(&app_handle)
}

/// Tauri command to update the application configuration.
///
/// Updates the in-memory state and persists the configuration to disk.
///
/// # Arguments
///
/// * `app_handle` - The Tauri application handle.
/// * `state` - The managed configuration state.
/// * `new_config` - The new configuration object.
///
/// # Returns
///
/// * `Result<(), String>` - Ok on success, error message on failure.
#[tauri::command]
fn update_config(
    app_handle: AppHandle,
    state: State<ConfigState>,
    new_config: AppConfig,
) -> Result<(), String> {
    save_config(&app_handle, &new_config)?;
    *state.0.lock().unwrap() = new_config;
    Ok(())
}

/// Tauri command to add a new task.
///
/// Assigns a new UUID to the task if one is not present, adds it to the configuration,
/// and saves the configuration to disk.
///
/// # Arguments
///
/// * `app_handle` - The Tauri application handle.
/// * `state` - The managed configuration state.
/// * `task` - The task to add.
///
/// # Returns
///
/// * `Result<(), String>` - Ok on success, error message on failure.
#[tauri::command]
fn add_task(
    app_handle: AppHandle,
    state: State<ConfigState>,
    mut task: Task,
) -> Result<(), String> {
    let mut config = state.0.lock().unwrap();
    if task.id.is_empty() {
        task.id = uuid::Uuid::new_v4().to_string();
    }
    config.tasks.push(task);
    save_config(&app_handle, &config)?;
    Ok(())
}

/// Tauri command to update an existing task.
///
/// Finds the task by ID and updates it. Saves the configuration to disk.
///
/// # Arguments
///
/// * `app_handle` - The Tauri application handle.
/// * `state` - The managed configuration state.
/// * `task` - The updated task object (must have a matching ID).
///
/// # Returns
///
/// * `Result<(), String>` - Ok on success, error message if task not found or save fails.
#[tauri::command]
fn update_task(app_handle: AppHandle, state: State<ConfigState>, task: Task) -> Result<(), String> {
    let mut config = state.0.lock().unwrap();
    if let Some(idx) = config.tasks.iter().position(|t| t.id == task.id) {
        config.tasks[idx] = task;
        save_config(&app_handle, &config)?;
        Ok(())
    } else {
        Err("Task not found".to_string())
    }
}

/// Tauri command to delete a task.
///
/// Removes the task with the specified ID from the configuration and saves changes.
///
/// # Arguments
///
/// * `app_handle` - The Tauri application handle.
/// * `state` - The managed configuration state.
/// * `task_id` - The ID of the task to delete.
///
/// # Returns
///
/// * `Result<(), String>` - Ok on success, error message if task not found or save fails.
#[tauri::command]
fn delete_task(
    app_handle: AppHandle,
    state: State<ConfigState>,
    task_id: String,
) -> Result<(), String> {
    let mut config = state.0.lock().unwrap();
    if let Some(idx) = config.tasks.iter().position(|t| t.id == task_id) {
        config.tasks.remove(idx);
        save_config(&app_handle, &config)?;
        Ok(())
    } else {
        Err("Task not found".to_string())
    }
}

/// The main entry point for the Tauri application.
///
/// Configures plugins, initializes state, sets up the system tray, starts the scheduler,
/// and registers command handlers.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_log::Builder::default().build())
        .setup(|app| {
            // Initialize config state
            let config = load_config(app.handle());
            app.manage(ConfigState(Mutex::new(config)));

            // System Tray
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            // Start scheduler
            let app_handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                start_scheduler(app_handle).await;
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_login_qr,
            check_login_status,
            get_config,
            update_config,
            add_task,
            update_task,
            delete_task
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
