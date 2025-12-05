# AutoCheckin-Next

AutoCheckin-Next 是一个基于 Tauri + React + Rust 构建的自动化签到工具。它旨在帮助用户管理和自动化特定平台的签到任务，提供直观的图形界面和可靠的后台调度功能。

## 功能特性

*   **跨平台支持**：基于 Tauri 构建，支持 Windows, macOS 和 Linux。
*   **任务管理**：
    *   添加、编辑、删除签到任务。
    *   自定义签到时间、班级ID。
    *   通过扫码获取 Cookie 凭证。
    *   支持地图选点，精确设置签到位置。
*   **自动化调度**：后台自动运行，准时执行签到任务。
*   **消息通知**：集成企业微信 (WeCom) 通知，实时推送签到结果。
*   **多语言支持**：内置中英文界面。
*   **防检测机制**：模拟真实浏览器 User-Agent，随机化 GPS 坐标偏移。

## 开发环境搭建

### 前置要求

在开始之前，请确保您的开发环境已安装以下工具：

1.  **Node.js** (推荐 LTS 版本) 和包管理器 (npm, yarn 或 pnpm)。
2.  **Rust** 编程语言环境 (通过 rustup 安装)。
3.  **Tauri** 开发依赖 (根据您的操作系统，参考 [Tauri 官方文档](https://tauri.app/v1/guides/getting-started/prerequisites))。

### 安装步骤

1.  克隆仓库：
    ```bash
    git clone https://github.com/your-username/autocheckin-next.git
    cd autocheckin-next/autocheckin-next
    ```

2.  安装前端依赖：
    ```bash
    npm install
    # 或者
    pnpm install
    # 或者
    yarn install
    ```

3.  运行开发服务器：
    ```bash
    npm run tauri dev
    # 或者
    pnpm tauri dev
    # 或者
    yarn tauri dev
    ```
    此命令将同时启动前端 Vite 服务器和 Tauri 应用程序窗口。

## 使用指南

### 1. 添加任务
   - 点击主界面右下角的 "+" 按钮。
   - 输入任务名称（例如："早自习"）。
   - 设置执行时间 (HH:mm)。
   - 输入班级 ID。
   - 点击 Cookie 输入框右侧的二维码图标，扫描二维码登录以获取 Cookie。
   - 点击地图图标，在地图上选择签到位置，或手动输入经纬度。
   - 点击 "保存"。

### 2. 配置企业微信通知 (可选)
   - 切换到 "Settings" (全局设置) 标签页。
   - 打开 "Enable" (启用) 开关。
   - 填写您的企业微信信息：
     - **CorpID**: 企业 ID。
     - **Secret**: 应用密钥。
     - **AgentID**: 应用 AgentID。
     - **ToUser**: 接收消息的用户 ID (通常为 "@all")。
   - 点击 "Save" (保存)。

### 3. 查看日志
   - 程序运行时，会自动在后台检查并执行任务。
   - 签到成功或失败的消息将通过配置的企业微信发送（如果已启用）。
   - 也可以在开发控制台查看详细日志。

## 项目结构

*   `src/`: 前端源代码 (React + TypeScript)。
    *   `components/`: UI 组件 (任务列表、对话框、设置等)。
    *   `i18n.ts`: 国际化配置。
*   `src-tauri/`: 后端源代码 (Rust)。
    *   `src/auth.rs`: 登录认证与二维码获取。
    *   `src/config.rs`: 配置管理与文件持久化。
    *   `src/scheduler.rs`: 任务调度循环。
    *   `src/task.rs`: 签到任务执行逻辑。

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
