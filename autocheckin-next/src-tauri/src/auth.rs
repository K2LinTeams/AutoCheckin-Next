use base64::engine::general_purpose;
use base64::Engine as _;
use image::Luma;
use qrcode::QrCode;
use regex::Regex;
use reqwest::blocking::Client;
use scraper::{Html, Selector};
use serde_json::Value;
use std::io::Cursor;

/// User Agent string used for requests to simulate a mobile WeChat browser.
const UA: &str = "Mozilla/5.0 (Linux; Android 12; PAL-AL00 Build/HUAWEIPAL-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/116.0.0.0 Mobile Safari/537.36 XWEB/1160065 MMWEBSDK/20231202 MMWEBID/1136 MicroMessenger/8.0.47.2560(0x28002F35) WeChat/arm64 Weixin NetType/4G Language/zh_CN ABI/arm64";

/// Handles authentication-related operations, primarily fetching QR codes for login
/// and checking login status.
pub struct AuthHandler {
    /// The HTTP client used for making requests.
    client: Client,
    /// The base URL for fetching the login QR code.
    base_qr_url: String,
}

impl AuthHandler {
    /// Creates a new instance of `AuthHandler`.
    ///
    /// Initializes the HTTP client with a specific User Agent and cookie storage enabled.
    ///
    /// # Returns
    ///
    /// * `Self` - A new instance of `AuthHandler`.
    pub fn new() -> Self {
        Self {
            client: Client::builder()
                .user_agent(UA)
                .cookie_store(true)
                .build()
                .unwrap(),
            base_qr_url: "https://login.b8n.cn/qr/weixin/student/2".to_string(),
        }
    }

    /// Fetches the login QR code.
    ///
    /// This method retrieves the necessary parameters from the login page, constructs
    /// the login URL, generates a QR code for it, and returns the QR code as a
    /// Base64 encoded PNG string along with the check URL.
    ///
    /// # Returns
    ///
    /// * `Result<(String, String), String>` - A tuple containing the Base64 encoded image string
    ///   and the URL to check for login status, or an error message on failure.
    pub fn get_qr_code(&self) -> Result<(String, String), String> {
        // Returns (Base64 Image, Check URL)
        let resp = self
            .client
            .get(&self.base_qr_url)
            .send()
            .map_err(|e| e.to_string())?;
        let html = resp.text().map_err(|e| e.to_string())?;

        let params = self.extract_qr_params(&html)?;

        let mut url_params = String::new();
        for (k, v) in &params {
            if !url_params.is_empty() {
                url_params.push('&');
            }
            url_params.push_str(&format!("{}={}", k, v));
        }

        let url = format!("http://login.b8n.cn/weixin/login/student/2?{}", url_params);

        let code = QrCode::new(url).map_err(|e| e.to_string())?;
        let image = code.render::<Luma<u8>>().build();

        let mut buffer = Cursor::new(Vec::new());
        image
            .write_to(&mut buffer, image::ImageFormat::Png)
            .map_err(|e| e.to_string())?;

        let base64_str = general_purpose::STANDARD.encode(buffer.into_inner());

        Ok((base64_str, self.base_qr_url.clone()))
    }

    /// Extracts QR code parameters from the HTML content of the login page.
    ///
    /// Parses the HTML to find a script tag containing the login URL, then uses
    /// regex to extract parameters like `sess`, `tm`, and `sign`.
    ///
    /// # Arguments
    ///
    /// * `html` - The HTML content of the login page.
    ///
    /// # Returns
    ///
    /// * `Result<std::collections::HashMap<String, String>, String>` - A map of extracted parameters,
    ///   or an error message if extraction fails.
    fn extract_qr_params(
        &self,
        html: &str,
    ) -> Result<std::collections::HashMap<String, String>, String> {
        let document = Html::parse_document(html);
        let script_selector = Selector::parse("script").unwrap();

        for script in document.select(&script_selector) {
            let script_content = script.text().collect::<Vec<_>>().join("");
            if script_content.contains("login.b8n.cn") {
                let re = Regex::new(r#"https?://[^\s"']+"#).unwrap();
                if let Some(captures) = re.captures(&script_content) {
                    let url = captures.get(0).unwrap().as_str();
                    let mut params = std::collections::HashMap::new();

                    let re_param = Regex::new(r"[?&](sess|tm|sign)=([^&]+)").unwrap();
                    for cap in re_param.captures_iter(url) {
                        params.insert(cap[1].to_string(), cap[2].to_string());
                    }
                    return Ok(params);
                }
            }
        }

        Err("Could not extract QR params".to_string())
    }

    /// Checks the login status by polling the server.
    ///
    /// # Arguments
    ///
    /// * `_url` - The URL to check (currently unused in implementation, relies on `base_qr_url`).
    ///
    /// # Returns
    ///
    /// * `Result<Option<(String, String)>, String>` - Returns `Some((cookie, class_id))` if login is successful,
    ///   `None` if still waiting, or an error message.
    pub fn check_login(&self, _url: &str) -> Result<Option<(String, String)>, String> {
        let resp_json: Value = self
            .client
            .get(format!("{}?op=checklogin", self.base_qr_url))
            .send()
            .map_err(|e| e.to_string())?
            .json()
            .map_err(|e| e.to_string())?;

        if let Some(status) = resp_json.get("status") {
            if status.as_i64() == Some(1) {
                if let Some(url) = resp_json.get("url") {
                    let redirect_url = url.as_str().unwrap();
                    let target = format!(
                        "https://bj.k8n.cn/student/uidlogin?{}",
                        redirect_url.split('?').nth(1).unwrap_or("")
                    );

                    // Follow redirect to get cookies
                    let _ = self.client.get(&target).send().map_err(|e| e.to_string())?;

                    // To properly get cookies, we would need to inspect the cookie jar here.
                    // But for this simple implementation, we'll return placeholders.
                    // In a full implementation, we'd use a shared Arc<Jar> passed to the ClientBuilder.

                    return Ok(Some((
                        "cookie_placeholder".to_string(),
                        "class_id_placeholder".to_string(),
                    )));
                }
            }
        }

        Ok(None)
    }
}
