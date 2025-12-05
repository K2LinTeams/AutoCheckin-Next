use crate::config::{load_config, AppConfig, Task};
use crate::task::TaskExecutor;
use chrono::Local;
use log::info;
use std::sync::Arc;
use std::time::Duration;
use tauri::AppHandle;
use tokio::time::sleep;

/// Starts the task scheduler loop.
///
/// This function runs indefinitely, checking every minute if there are any enabled tasks
/// scheduled for the current time. If matching tasks are found, they are executed in
/// separate threads using `tokio::task::spawn_blocking`.
///
/// # Arguments
///
/// * `app_handle` - The Tauri application handle, used to load the configuration.
pub async fn start_scheduler(app_handle: AppHandle) {
    info!("Scheduler started");
    loop {
        // Run check every minute
        let now = Local::now();
        let current_time = now.format("%H:%M").to_string();

        info!("Scheduler tick: {}", current_time);

        let config: AppConfig = load_config(&app_handle);

        // Find tasks scheduled for now
        let tasks_to_run: Vec<Task> = config
            .tasks
            .into_iter()
            .filter(|t| t.enable && t.time == current_time)
            .collect();

        if !tasks_to_run.is_empty() {
            info!("Found {} tasks to run.", tasks_to_run.len());

            let wecom_config = config.global.wecom.clone();
            let executor = Arc::new(TaskExecutor::new(wecom_config));

            for task in tasks_to_run {
                let executor_clone = executor.clone();
                // Spawn a blocking thread for each task to avoid blocking the async loop?
                // Since `TaskExecutor` uses blocking reqwest, we should use `spawn_blocking`.

                tokio::task::spawn_blocking(move || {
                    executor_clone.execute(&task);
                });
            }
        }

        // Sleep for 60 seconds
        sleep(Duration::from_secs(60)).await;
    }
}
