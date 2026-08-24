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
 * 将数据 URL 转换为 Blob 并触发下载保存
 * @param {string} dataUrl PNG 的 data URL
 * @param {string} filename 目标文件名（含 .png 后缀）
 * @returns {Promise<void>}
 */
function downloadPng(dataUrl, filename) {
  return new Promise((resolve, reject) => {
    fetch(dataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        chrome.downloads.download(
          {
            url,
            filename,
            saveAs: false,
          },
          (downloadId) => {
            URL.revokeObjectURL(url);
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(downloadId);
          }
        );
      })
      .catch(reject);
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

    case 'DOWNLOAD_PNG': {
      // 下载 PNG 文件
      await downloadPng(message.dataUrl, message.filename);
      return { ok: true };
    }

    default:
      // 未知消息类型，返回失败标记，避免 Promise 挂起
      return { ok: false, error: `未知消息类型: ${message?.type}` };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
