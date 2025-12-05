use crate::config::{Task, WeComConfig};
use chrono::Local;
use log::{error, info};
use regex::Regex;
use reqwest::blocking::Client;
use reqwest::header::{HeaderMap, HeaderValue, COOKIE, REFERER, USER_AGENT};
use scraper::{Html, Selector};
use serde_json::Value;
use std::collections::HashSet;
use std::thread;
use std::time::Duration;

/// User Agent string used for requests to simulate a mobile WeChat browser.
const UA: &str = "Mozilla/5.0 (Linux; Android 12; PAL-AL00 Build/HUAWEIPAL-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36 XWEB/1160065 MMWEBSDK/20231202 MMWEBID/1136 MicroMessenger/8.0.47.2560(0x28002F35) WeChat/arm64 Weixin NetType/4G Language/zh_CN ABI/arm64";

/// Executes check-in tasks.
///
/// Handles the interaction with the target website to perform check-ins.
/// Also handles sending notifications via WeCom if enabled.
pub struct TaskExecutor {
    /// The HTTP client used for making requests.
    client: Client,
    /// The base URL of the target website.
    base_url: String,
    /// WeCom configuration for sending notifications.
    wecom: WeComConfig,
}

impl TaskExecutor {
    /// Creates a new `TaskExecutor`.
    ///
    /// # Arguments
    ///
    /// * `wecom` - The WeCom configuration.
    ///
    /// # Returns
    ///
    /// * `Self` - A new instance of `TaskExecutor`.
    pub fn new(wecom: WeComConfig) -> Self {
        Self {
            client: Client::builder().user_agent(UA).build().unwrap(),
            base_url: "http://k8n.cn".to_string(),
            wecom,
        }
    }

    /// Executes a specific check-in task.
    ///
    /// If the task is enabled, it fetches active check-in sessions, and for each session,
    /// it attempts to perform a sign-in with a slightly randomized location.
    /// Sends a WeCom notification with the result.
    ///
    /// # Arguments
    ///
    /// * `task` - The task to execute.
    pub fn execute(&self, task: &Task) {
        if !task.enable {
            return;
        }

        info!(">>> Starting task: {} <<<", task.name);

        let headers = self.build_headers(&task.cookie, &task.class_id);

        // Fetch active tasks
        let active_ids = match self.get_active_tasks(&headers, &task.class_id) {
            Ok(ids) => ids,
            Err(e) => {
                error!("Failed to get active tasks for {}: {}", task.name, e);
                return;
            }
        };

        if active_ids.is_empty() {
            info!("[{}] No active check-in tasks.", task.name);
            return;
        }

        for sign_id in active_ids {
            thread::sleep(Duration::from_secs_f64(rand::random::<f64>() * 4.0 + 1.0));

            let (lat, lng) = self.random_coordinate(&task.location.lat, &task.location.lng);

            let result = self.perform_sign(&headers, &task.class_id, &sign_id, &lat, &lng);
            let msg = match &result {
                Ok(msg) => msg.clone(),
                Err(e) => e.clone(),
            };

            let log_msg = format!(
                "Task [{}] Result: {} (Loc: {},{})",
                task.name, msg, lat, lng
            );
            info!("{}", log_msg);

            let success = result.is_ok() && (msg.contains("成功") || msg.contains("Success"));

            if success || msg.contains("出错") || msg.contains("Error") {
                let _ = self
                    .send_wecom_notification(&format!("{} Check-in Result", task.name), &log_msg);
            } else {
                let _ = self
                    .send_wecom_notification(&format!("{} Check-in Failed", task.name), &log_msg);
            }
        }
    }

    /// Builds the HTTP headers required for requests.
    ///
    /// Sets the User-Agent, Referer, and Cookie headers.
    ///
    /// # Arguments
    ///
    /// * `cookie` - The session cookie.
    /// * `class_id` - The class ID, used for the Referer header.
    ///
    /// # Returns
    ///
    /// * `HeaderMap` - The constructed headers.
    fn build_headers(&self, cookie: &str, class_id: &str) -> HeaderMap {
        let mut headers = HeaderMap::new();
        headers.insert(USER_AGENT, HeaderValue::from_static(UA));
        // headers.insert(X_REQUESTED_WITH, HeaderValue::from_static("com.tencent.mm"));

        let referer = format!("{}/student/course/{}", self.base_url, class_id);
        if let Ok(val) = HeaderValue::from_str(&referer) {
            headers.insert(REFERER, val);
        }

        let real_cookie = cookie.replace("username=", ""); // Simplified cleaning
        if let Ok(val) = HeaderValue::from_str(&real_cookie) {
            headers.insert(COOKIE, val);
        }

        headers
    }

    /// Fetches the list of active check-in session IDs.
    ///
    /// Parses the course page to find active check-in elements.
    ///
    /// # Arguments
    ///
    /// * `headers` - The HTTP headers to use for the request.
    /// * `class_id` - The class ID to check.
    ///
    /// # Returns
    ///
    /// * `Result<HashSet<String>, String>` - A set of active check-in IDs, or an error message.
    fn get_active_tasks(
        &self,
        headers: &HeaderMap,
        class_id: &str,
    ) -> Result<HashSet<String>, String> {
        let url = format!("{}/student/course/{}/punchs", self.base_url, class_id);
        let resp = self
            .client
            .get(&url)
            .headers(headers.clone())
            .send()
            .map_err(|e| e.to_string())?;
        let text = resp.text().map_err(|e| e.to_string())?;

        let document = Html::parse_document(&text);
        let card_selector = Selector::parse("div.card-body").unwrap();

        let mut active_ids = HashSet::new();
        let re1 = Regex::new(r"punchcard_(\d+)").unwrap();
        let re2 = Regex::new(r"punch_pwd_frm_(\d+)").unwrap();
        let re3 = Regex::new(r"punch_gps\((\d+)\)").unwrap();

        for card in document.select(&card_selector) {
            let card_html = card.html();
            if card_html.contains("已签") {
                continue;
            }

            for cap in re1.captures_iter(&card_html) {
                active_ids.insert(cap[1].to_string());
            }
            for cap in re2.captures_iter(&card_html) {
                active_ids.insert(cap[1].to_string());
            }
            for cap in re3.captures_iter(&card_html) {
                active_ids.insert(cap[1].to_string());
            }
        }

        Ok(active_ids)
    }

    /// Performs the sign-in request for a specific session.
    ///
    /// # Arguments
    ///
    /// * `headers` - The HTTP headers to use.
    /// * `class_id` - The class ID.
    /// * `sign_id` - The check-in session ID.
    /// * `lat` - The latitude to report.
    /// * `lng` - The longitude to report.
    ///
    /// # Returns
    ///
    /// * `Result<String, String>` - A success message or an error message based on the response content.
    fn perform_sign(
        &self,
        headers: &HeaderMap,
        class_id: &str,
        sign_id: &str,
        lat: &str,
        lng: &str,
    ) -> Result<String, String> {
        let url = format!(
            "{}/student/punchs/course/{}/{}",
            self.base_url, class_id, sign_id
        );
        let params = [
            ("id", sign_id),
            ("lat", lat),
            ("lng", lng),
            ("acc", "10.0"),
            ("res", ""),
            ("gps_addr", ""),
            ("pwd", ""),
        ];

        let resp = self
            .client
            .post(&url)
            .headers(headers.clone())
            .form(&params)
            .send()
            .map_err(|e| e.to_string())?;
        let text = resp.text().map_err(|e| e.to_string())?;

        let document = Html::parse_document(&text);
        let res_text = document.root_element().text().collect::<Vec<_>>().join("");

        if res_text.contains("成功") || res_text.contains("Success") {
            Ok("签到成功".to_string())
        } else {
            Err(res_text.trim().chars().take(50).collect())
        }
    }

    /// Generates a randomized coordinate within a small radius of the target location.
    ///
    /// Helps to simulate natural GPS drift and avoid detection of static coordinates.
    ///
    /// # Arguments
    ///
    /// * `lat` - The base latitude.
    /// * `lng` - The base longitude.
    ///
    /// # Returns
    ///
    /// * `(String, String)` - The randomized latitude and longitude.
    fn random_coordinate(&self, lat: &str, lng: &str) -> (String, String) {
        let lat_val = lat.parse::<f64>().unwrap_or(0.0);
        let lng_val = lng.parse::<f64>().unwrap_or(0.0);

        let offset = 0.00015;
        let r_lat = lat_val + (rand::random::<f64>() * 2.0 - 1.0) * offset;
        let r_lng = lng_val + (rand::random::<f64>() * 2.0 - 1.0) * offset;

        (format!("{:.6}", r_lat), format!("{:.6}", r_lng))
    }

    /// Sends a notification via WeCom (Enterprise WeChat).
    ///
    /// Retrieves an access token and then sends a text message to the configured user.
    ///
    /// # Arguments
    ///
    /// * `title` - The title of the notification.
    /// * `content` - The content of the notification.
    ///
    /// # Returns
    ///
    /// * `Result<(), String>` - Ok on success, or an error message on failure.
    fn send_wecom_notification(&self, title: &str, content: &str) -> Result<(), String> {
        if !self.wecom.enable {
            return Ok(());
        }

        let token_url = format!(
            "https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid={}&corpsecret={}",
            self.wecom.corpid, self.wecom.secret
        );
        let token_resp: Value = self
            .client
            .get(&token_url)
            .send()
            .map_err(|e| e.to_string())?
            .json()
            .map_err(|e| e.to_string())?;

        let token = token_resp
            .get("access_token")
            .and_then(|v| v.as_str())
            .ok_or("Failed to get access token")?;

        let msg_url = format!(
            "https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token={}",
            token
        );
        let full_content = format!(
            "【Checkin Magic】\n{}\n----------------\n{}\nTime: {}",
            title,
            content,
            Local::now().format("%Y-%m-%d %H:%M:%S")
        );

        let payload = serde_json::json!({
            "touser": self.wecom.touser,
            "msgtype": "text",
            "agentid": self.wecom.agentid,
            "text": {
                "content": full_content
            },
            "safe": 0
        });

        let send_resp: Value = self
            .client
            .post(&msg_url)
            .json(&payload)
            .send()
            .map_err(|e| e.to_string())?
            .json()
            .map_err(|e| e.to_string())?;

        if send_resp.get("errcode").and_then(|v| v.as_i64()) == Some(0) {
            Ok(())
        } else {
            Err(format!("WeCom Error: {:?}", send_resp))
        }
    }
}
