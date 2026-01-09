const urlInput = document.getElementById('videoUrl');
const wrapper = document.getElementById('inputWrapper');
const badge = document.getElementById('urlBadge');
const resultArea = document.getElementById('resultArea');
let debounceTimer;

window.onload = function() {
    selectMode('video');
};

urlInput.addEventListener('input', (e) => {
    handleInput(e.target.value);
});

// 新增：点击输入框时，如果有内容，则请求权限（这里模拟为询问是否清空）
urlInput.addEventListener('click', async () => {
    if (urlInput.value.trim().length > 0) {
        // 使用 Clipboard API 读取剪贴板内容
        try {
            const text = await navigator.clipboard.readText();
            if (text && text !== urlInput.value) {
                // 如果剪贴板有内容且与当前输入框内容不同，直接替换
                urlInput.value = text;
                handleInput(text);
            } else {
                // 如果剪贴板内容相同或无法读取，则全选文本方便删除
                urlInput.select();
            }
        } catch (err) {
            // 如果没有权限读取剪贴板，则全选文本
            urlInput.select();
        }
    }
});

function handleInput(val) {
    // 自动清洗 Bilibili 分享链接
    if (val && val.includes('bilibili.com/video/')) {
        const match = val.match(/(https?:\/\/(?:www\.)?bilibili\.com\/video\/[A-Za-z0-9]+\/?)/);
        if (match) {
            const cleanUrl = match[1];
            if (val !== cleanUrl) {
                val = cleanUrl;
                urlInput.value = val;
            }
        }
    }

    if (val.trim().length > 0) {
        wrapper.classList.add('has-content');

        if (val.includes('list=') || val.includes('collection')) {
            badge.textContent = '列表 📚';
        } else if (val.includes('bilibili')) {
            badge.textContent = 'Bilibili 📺';
        } else if (val.includes('youtu')) {
            badge.textContent = 'YouTube 🎬';
        } else {
            badge.textContent = '链接 🔗';
        }

        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            fetchVideoInfo(val.trim());
        }, 500);

    } else {
        wrapper.classList.remove('has-content');
        hidePreview();
    }
    generate();
}

async function fetchVideoInfo(url) {
    if (!url.startsWith('http')) return;

    try {
        const res = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
        if (res.ok) {
            const data = await res.json();
            showPreview(data);
        } else {
            hidePreview();
        }
    } catch (e) {
        console.error("Fetch info failed", e);
        hidePreview();
    }
}

function showPreview(data) {
    const card = document.getElementById('previewCard');
    document.getElementById('previewTitle').textContent = data.title;
    document.getElementById('previewAuthor').textContent = data.author_name;
    document.getElementById('previewThumb').src = data.thumbnail_url;

    // --- 渲染徽章逻辑 (水平排列 + 分隔符) ---
    const badgesContainer = document.getElementById('infoBadges');
    const separator = document.getElementById('infoSeparator');
    badgesContainer.innerHTML = ''; // 清空

    let hasBadges = false;

    // 1. 分辨率
    if (data.max_res) {
        const resBadge = document.createElement('span');
        resBadge.className = 'info-badge badge-res';
        resBadge.textContent = data.max_res;
        if (data.max_res === '4K') resBadge.classList.add('is-4k');
        badgesContainer.appendChild(resBadge);
        hasBadges = true;
    }

    // 2. 字幕信息
    if (data.has_zh_sub !== null && data.has_zh_sub !== undefined) {
        const hasZh = data.has_zh_sub;
        const hasEn = data.has_en_sub;

        if (!hasZh && !hasEn) {
            const badge = document.createElement('span');
            badge.className = 'info-badge badge-none';
            badge.textContent = '无字';
            badgesContainer.appendChild(badge);
        } else {
            if (hasZh) {
                const zhBadge = document.createElement('span');
                zhBadge.className = 'info-badge badge-sub';
                zhBadge.textContent = '中字';
                badgesContainer.appendChild(zhBadge);
            }
            if (hasEn) {
                const enBadge = document.createElement('span');
                enBadge.className = 'info-badge badge-sub';
                enBadge.textContent = '英字';
                badgesContainer.appendChild(enBadge);
            }
        }
        hasBadges = true;
    }

    // 3. ✨ YouTube 补充逻辑：如果没有任何标签（比如是YouTube且API没返回详情），显示一个基础标签
    if (!hasBadges && data.provider === 'youtube') {
        const ytBadge = document.createElement('span');
        ytBadge.className = 'info-badge badge-res'; // 复用普通标签样式
        ytBadge.textContent = 'YouTube';
        badgesContainer.appendChild(ytBadge);
        hasBadges = true;
    }

    // 控制分隔线显示
    separator.style.display = hasBadges ? 'block' : 'none';
    // --- 结束 ---

    card.classList.add('visible');
}

function hidePreview() {
    const card = document.getElementById('previewCard');
    card.classList.remove('visible');
    setTimeout(() => {
        if(!card.classList.contains('visible')) {
            document.getElementById('previewThumb').src = '';
        }
    }, 400);
}

function selectMode(mode) {
    document.querySelectorAll('.checkbox-label').forEach(el => el.classList.remove('checked'));
    const activeLabel = document.getElementById('lbl-' + mode);
    if (activeLabel) {
        activeLabel.classList.add('checked');
    }

    const radio = document.querySelector(`input[value="${mode}"]`);
    if (radio) {
        radio.checked = true;
        generate();
    }
}

function generate() {
    const url = urlInput.value.trim();
    const outputArea = document.getElementById('output');
    const modeInput = document.querySelector('input[name="mode"]:checked');
    const mode = modeInput ? modeInput.value : 'video';

    let currentPath = document.getElementById('dlPath').value.trim();
    if (!currentPath) currentPath = '.';

    if (!url) {
        resultArea.classList.remove('visible');
        return;
    }

    let command = "";
    const baseCmd = `yt-dlp "${url}" -P "${currentPath}" -o "%(title)s.%(ext)s"`;

    // 修复: 处理路径中的 ~ 符号，并使用双引号包裹以确保 shell 展开
    let execPath = currentPath;
    if (execPath.startsWith('~/')) {
        execPath = '$HOME' + execPath.substring(1);
    }

    // 使用转义双引号 \" 包裹路径，解决路径中有空格和 ~ 展开的问题
    const whisperExec = ` --exec "whisper {} --model medium --output_format srt --output_dir \\"${execPath}\\""`;

    switch (mode) {
        case 'video':
            command = `${baseCmd} --format "bv+ba/b" --embed-subs --sub-langs "en.*,zh.*" --merge-output-format mkv --embed-thumbnail`;
            break;
        case 'audio':
            command = `${baseCmd} -x --audio-format mp3 --embed-thumbnail`;
            break;
        case 'sub':
            command = `${baseCmd} --write-sub --sub-langs "en.*,zh.*" --convert-subs srt --skip-download`;
            break;
        case 'whisper':
            command = `${baseCmd} --format "bv+ba/b" --no-write-subs --merge-output-format mkv --embed-thumbnail${whisperExec}`;
            break;
        case 'cover':
            command = `${baseCmd} --write-thumbnail --skip-download --convert-thumbnails jpg`;
            break;
    }

    if (command) {
        outputArea.value = command;
        resultArea.classList.add('visible');
    } else {
        resultArea.classList.remove('visible');
    }
}

function copyText() {
    const output = document.getElementById("output");
    if (!output.value) return;

    const tempInput = document.createElement("textarea");
    tempInput.value = output.value;
    tempInput.style.position = "absolute";
    tempInput.style.left = "-9999px";
    tempInput.style.top = "0";
    document.body.appendChild(tempInput);

    tempInput.select();
    document.execCommand("copy");

    document.body.removeChild(tempInput);

    const btn = document.querySelector('.copy-btn');
    if (btn.innerText.includes("✓")) return;

    const originalText = btn.innerText;
    btn.innerText = "✓ 已复制";
    btn.style.background = "rgba(169, 255, 104, 0.3)";
    btn.style.color = "#a9ff68";

    setTimeout(() => {
        btn.innerText = originalText;
        btn.style.background = "";
        btn.style.color = "";
    }, 2000);
}
