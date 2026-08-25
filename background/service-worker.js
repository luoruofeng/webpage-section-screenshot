/**
 * 后台 Service Worker
 *
 * 职责：
 * - 作为消息中转站，转发 Popup 与 Content Script 之间的请求
 * - 调用 chrome.tabs.captureVisibleTab 获取视口截图
 * - 调用 chrome.downloads 保存 PNG 文件
 *
 * 遵循 MV3 Service Worker 生命周期规范：无状态、事件驱动、可随时销毁重建。
 */

const DEFAULT_QUALITY = 1;

/**
 * 确保 Offscreen Document（离屏文档）存在。
 * 在 MV3 中 Service Worker 无法使用 URL.createObjectURL，需借助离屏文档
 * 完成 data URL → Blob → blob URL 的转换，从而突破 chrome.downloads 对
 * data URL 的 2MB 长度限制。
 */
async function ensureOffscreenDocument() {
  const OFFSCREEN_REASON = 'BLOBS';
  const offscreenUrl = chrome.runtime.getURL('background/offscreen.html');
  const existing = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [offscreenUrl],
  });
  if (existing.length > 0) return;
  await chrome.offscreen.createDocument({
    url: 'background/offscreen.html',
    reasons: [OFFSCREEN_REASON],
    justification:
      '将 PNG data URL 转换为 Blob URL 以突破下载长度限制，确保保存为正确的 PNG 文件。',
  });
}

/**
 * 获取当前激活窗口的可见区域截图（返回 DataURL）
 * captureVisibleTab 不接收 tabId，第一个参数是可选的 windowId；
 * 不传 windowId 即截取当前激活窗口（即当前标签页所在窗口）。
 * @returns {Promise<string>} data URL
 */
async function captureVisibleTab() {
  const dataUrl = await chrome.tabs.captureVisibleTab({
    format: 'png',
    quality: DEFAULT_QUALITY,
  });
  return dataUrl;
}

/**
 * 触发 PNG 下载保存
 *
 * 说明：直接使用 data URL 调用 chrome.downloads.download 受 2MB 长度限制，
 * 超长（超分辨率截图）时下载会失败或被错误保存为 .txt 文本文件；
 * 而 MV3 Service Worker 中又不可用 URL.createObjectURL 生成 blob URL。
 * 因此统一通过 Offscreen Document（离屏文档）在常规 DOM 环境中将 data URL
 * 转换为 Blob 并生成 blob 对象 URL。离屏文档无 chrome.downloads 权限，
 * 所以最终下载动作由 Service Worker 使用返回的 blob URL 调用
 * chrome.downloads.download 完成，突破长度限制且类型稳定。
 *
 * 大 data URL 由 Content Script 分段发送（DOWNLOAD_CHUNK），
 * 此处逐段转发给离屏文档累积，最后再通知离屏文档组装（DOWNLOAD_ASSEMBLE）。
 *
 * @param {string} filename 目标文件名（含 .png 后缀）
 * @param {string} chunk 当前分段的 data URL 内容
 * @param {number} chunkCount 分段总数
 * @param {number} index 当前分段下标（从 0 开始）
 * @returns {Promise<{ok:boolean}>}
 */
async function forwardChunkToOffscreen(filename, chunk, chunkCount, index) {
  await ensureOffscreenDocument();
  const response = await chrome.runtime.sendMessage({
    action: 'OFFSCREEN_CHUNK',
    filename,
    chunk,
    chunkCount,
    index,
  });
  if (response?.ok === false) {
    throw new Error(response.error || 'Blob 分段写入失败');
  }
  return { ok: true };
}

/**
 * 通知离屏文档组装 data URL 为 Blob URL，并在 Service Worker 中触发下载。
 *
 * @param {string} filename 目标文件名（含 .png 后缀）
 * @param {number} chunkCount 分段总数
 * @returns {Promise<number>} 下载 ID
 */
async function assembleAndDownload(filename, chunkCount) {
  await ensureOffscreenDocument();
  const response = await chrome.runtime.sendMessage({
    action: 'OFFSCREEN_ASSEMBLE',
    filename,
    chunkCount,
  });
  if (response?.ok === false) {
    throw new Error(response.error || 'Blob 组装失败');
  }
  // 由 Service Worker 执行真实下载（离屏文档无 chrome.downloads 权限）
  return triggerDownload(response.url, filename);
}

/**
 * 使用 blob URL 触发下载（调用 chrome.downloads.download）
 * @param {string} url blob 对象 URL
 * @param {string} filename 目标文件名（含 .png 后缀）
 * @returns {Promise<number>} 下载 ID
 */
function triggerDownload(url, filename) {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(
      { url, filename, saveAs: false },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(downloadId);
      }
    );
  });
}

/**
 * 消息处理入口
 * @param {Object} message 消息对象
 * @param {chrome.runtime.MessageSender} sender 消息发送者
 */
async function handleMessage(message, sender) {
  switch (message?.type) {
    case 'CAPTURE_VISIBLE_TAB': {
      // 视口截图（截取当前激活窗口）
      const dataUrl = await captureVisibleTab();
      return { ok: true, dataUrl };
    }

    case 'DOWNLOAD_CHUNK': {
      // Content -> Offscreen：转发一段 data URL 给离屏文档累积
      await forwardChunkToOffscreen(
        message.filename,
        message.chunk,
        message.chunkCount,
        message.index
      );
      return { ok: true };
    }

    case 'DOWNLOAD_ASSEMBLE': {
      // Content -> Offscreen：通知离屏文档组装 Blob，并在本 SW 触发下载
      await assembleAndDownload(message.filename, message.chunkCount);
      return { ok: true };
    }

    case 'OPEN_DOWNLOADS_FOLDER': {
      // Content -> Background：打开默认下载文件夹
      chrome.downloads.showDefaultFolder();
      return { ok: true };
    }

    case 'OFFSCREEN_CHUNK':
    case 'OFFSCREEN_ASSEMBLE':
      // 该消息仅面向 Offscreen Document（离屏文档）处理，Service Worker 不响应，
      // 返回 undefined 以让离屏文档成为唯一响应方，避免抢占 sendResponse 通道。
      return undefined;

    default:
      // 未知消息类型，返回失败标记，避免 Promise 挂起
      return { ok: false, error: `未知消息类型: ${message?.type}` };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (
    message?.action === 'OFFSCREEN_CHUNK' ||
    message?.action === 'OFFSCREEN_ASSEMBLE'
  ) {
    // 该消息仅面向 Offscreen Document，Service Worker 不参与响应，
    // 返回 false 表示本监听器不处理，让离屏文档成为唯一响应方。
    return false;
  }
  handleMessage(message, sender)
    .then((result) => sendResponse(result))
    .catch((error) =>
      sendResponse({ ok: false, error: error.message || String(error) })
    );
  // 返回 true 表示异步发送响应
  return true;
});

// 供 MV3 生命周期管理，Service Worker 在闲置时会被回收，
// 所有状态通过消息驱动，无持久化全局变量。

/**
 * 向指定标签页发送消息，并返回其响应
 * @param {number} tabId
 * @param {Object} message
 * @returns {Promise<Object|undefined>}
 */
function sendToTab(tabId, message) {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        // 页面尚未注入 content script 时忽略
        resolve(undefined);
        return;
      }
      resolve(response);
    });
  });
}

/**
 * 根据主菜单可见状态更新插件图标角标（badge）
 * @param {boolean} visible 主菜单（工具条）当前是否可见
 */
function updateBadge(visible) {
  chrome.action.setBadgeBackgroundColor({ color: visible ? '#2563eb' : '#9ca3af' });
  chrome.action.setBadgeText({ text: visible ? '' : 'OFF' });
}

/**
 * 点击插件 ICON：切换页面右上角主菜单（工具条）的显示 / 隐藏，
 * 并同步控制标尺的显示 / 隐藏（两者状态一致）。
 */
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  const response = await sendToTab(tab.id, { type: 'SSS_TOGGLE_MENU' });
  if (response?.ok) {
    updateBadge(response.visible);
  }
});
