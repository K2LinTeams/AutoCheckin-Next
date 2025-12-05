// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/// The main entry point of the binary.
///
/// Delegates execution to the `autocheckin_next_lib::run` function.
fn main() {
    autocheckin_next_lib::run()
}
