/**
 * Popup 脚本 — 控制面板逻辑
 *
 * 职责：将 Popup 按钮操作转发到当前标签页的 content script，并展示实时状态。
 * 高内聚：Popup 逻辑独立；低耦合：仅通过消息与 content script 通信。
 */

const MSG = {
  START_CAPTURE: 'SSS_START_CAPTURE',
  CLEAR_GUIDES: 'SSS_CLEAR_GUIDES',
  TOGGLE_RULER: 'SSS_TOGGLE_RULER',
  GET_STATE: 'SSS_GET_STATE',
};

/**
 * 向当前标签页发送消息
 * @param {Object} message
 * @returns {Promise<Object>}
 */
function sendToTab(message) {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id) {
        reject(new Error('未找到当前标签页'));
        return;
      }
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    });
  });
}

/**
 * 初始化状态展示
 */
async function refreshState() {
  try {
    const state = await sendToTab({ type: MSG.GET_STATE });
    document.getElementById('guideCount').textContent = String(state.guideCount ?? 0);
    document.getElementById('rulerState').textContent = state.rulerVisible ? '已显示' : '已隐藏';
  } catch (e) {
    // 页面不支持（如 chrome:// 页面）时显示提示
    document.getElementById('guideCount').textContent = '—';
    document.getElementById('rulerState').textContent = '不可用';
  }
}

/**
 * 绑定按钮事件
 */
function bindEvents() {
  document.getElementById('startBtn').addEventListener('click', async () => {
    try {
      await sendToTab({ type: MSG.START_CAPTURE });
      window.close(); // 触发后关闭 Popup，让用户看到页面上的进度
    } catch (e) {
      alert('无法启动截图：' + e.message);
    }
  });

  document.getElementById('clearBtn').addEventListener('click', async () => {
    try {
      await sendToTab({ type: MSG.CLEAR_GUIDES });
      await refreshState();
    } catch (e) {
      alert('无法清空参考线：' + e.message);
    }
  });

  document.getElementById('toggleRulerBtn').addEventListener('click', async () => {
    try {
      await sendToTab({ type: MSG.TOGGLE_RULER });
      await refreshState();
    } catch (e) {
      alert('无法切换标尺：' + e.message);
    }
  });
}

// 初始化
bindEvents();
refreshState();
