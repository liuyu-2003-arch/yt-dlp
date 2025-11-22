# YouTube DL Command Generator (Web UI)

![界面预览](preview.png)

> 一个高颜值、轻量级的 `yt-dlp` 命令行生成助手。

这是一个单页 Web 应用（Single HTML File），无需服务器，完全在浏览器本地运行。它采用优雅的 Mac 风格界面（Glassmorphism + 动态曲线背景），帮助你快速生成复杂的下载命令，支持视频合并、音频提取及字幕下载。

## ✨ 功能特点 (Features)

*   **视觉美学**：粉紫撞色渐变与柔和的动态曲线背景，配合毛玻璃（Frosted Glass）质感 UI。
*   **智能交互**：
    *   自动识别单视频链接或播放列表（Playlist）。
    *   URL 输入后右侧动画提示状态。
    *   生成命令后支持一键复制，按钮位于右下角不遮挡内容。
*   **多模式支持**：
    *   🎬 **视频模式**：下载最佳画质视频 + 音频 + 中英双语字幕，自动合并为 **MKV** 格式。
    *   🎵 **音频模式**：独立提取音频并转换为 **MP3** 格式。
    *   📝 **字幕模式**：仅下载 **SRT** 格式的中英字幕。
*   **组合逻辑**：支持多选（如同时勾选视频和音频），自动生成 `&&` 组合命令，一步到位。
*   **隐私安全**：所有逻辑均在本地浏览器执行，不上传任何数据。

## 🛠 前置需求 (Prerequisites)

本工具仅用于**生成命令**，要在终端执行生成的命令，您的电脑需要安装以下核心工具：

1.  **yt-dlp** (下载核心)
2.  **ffmpeg** (用于合并音视频及格式转换)

### macOS 安装 (推荐)

使用 [Homebrew](https://brew.sh/) 安装：

```bash
brew install yt-dlp ffmpeg
```

### Windows 安装

使用 [Chocolatey](https://chocolatey.org/) 或 [Scoop](https://scoop.sh/) 安装：

*   **Chocolatey:**
    ```bash
    choco install yt-dlp ffmpeg
    ```
*   **Scoop:**
    ```bash
    scoop install yt-dlp ffmpeg
    ```

### Linux 安装

使用你的发行版包管理器安装，例如在 Debian/Ubuntu 上：

```bash
sudo apt update && sudo apt install yt-dlp ffmpeg
```

## 🚀 如何使用 (Usage)

1.  **下载文件**：下载 `index.html` 文件到你的电脑上。
2.  **浏览器打开**：直接用浏览器（如 Chrome, Safari, Firefox）打开这个 `index.html` 文件。
3.  **粘贴链接**：将 YouTube 视频或播放列表的链接粘贴到输入框中。
4.  **选择模式**：根据需要勾选“视频”、“音频”或“字幕”模式。
5.  **复制命令**：点击右下角的“复制命令”按钮。
6.  **终端执行**：打开你的终端（Terminal），粘贴并运行刚刚复制的命令。

**注意**：默认下载路径为 `~/Movies/YouTube DL/`。请确保该目录存在，或根据需要手动修改生成的命令中的路径。
