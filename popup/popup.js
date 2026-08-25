/**
 * Popup 脚本 — 控制面板逻辑
 *
 * 职责：将 Popup 按钮操作转发到当前标签页的 content script，并展示实时状态。
 * 高内聚：Popup 逻辑独立；低耦合：仅通过消息与 content script 通信。
 *
 * 国际化：复用 content/modules/I18n.js 暴露的全局单例 SSS.I18n，
 * 语言优先级与页面内插件一致（先取已保存语言，否则按浏览器语言检测）。
 */

const MSG = {
  START_CAPTURE: 'SSS_START_CAPTURE',
  CLEAR_GUIDES: 'SSS_CLEAR_GUIDES',
  TOGGLE_RULER: 'SSS_TOGGLE_RULER',
  GET_STATE: 'SSS_GET_STATE',
};

const SETTINGS_KEY = 'sss_settings';

/**
 * 应用界面语言：先按浏览器语言设置默认值，再用已保存的语言覆盖。
 */
async function applyLanguage() {
  let savedLang = null;
  try {
    const data = await chrome.storage.local.get(SETTINGS_KEY);
    savedLang = data?.[SETTINGS_KEY]?.language ?? null;
  } catch (e) {
    // 存储不可用时静默降级为浏览器语言
  }
  SSS.I18n.setLanguage(savedLang || SSS.I18n.detectLanguage());
  document.documentElement.lang = SSS.I18n.lang;
  refreshTexts();
}

/**
 * 将字典文案渲染到带 data-i18n 属性的元素上。
 * 对于包含子元素（如 SVG 图标）的按钮，仅替换最后一个文本节点，保留图标。
 */
function refreshTexts() {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const text = SSS.I18n.t(el.dataset.i18n);
    const lastChild = el.lastChild;
    if (lastChild && lastChild.nodeType === Node.TEXT_NODE) {
      lastChild.textContent = text;
    } else {
      el.innerHTML = text;
    }
  });
}

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
        reject(new Error(SSS.I18n.t('popupNoTab')));
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
    document.getElementById('rulerState').textContent = state.rulerVisible
      ? SSS.I18n.t('popupRulerShown')
      : SSS.I18n.t('popupRulerHidden');
  } catch (e) {
    // 页面不支持（如 chrome:// 页面）时显示提示
    document.getElementById('guideCount').textContent = '—';
    document.getElementById('rulerState').textContent = SSS.I18n.t('popupUnavailable');
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
      alert(SSS.I18n.t('popupStartFail', { msg: e.message }));
    }
  });

  document.getElementById('clearBtn').addEventListener('click', async () => {
    try {
      await sendToTab({ type: MSG.CLEAR_GUIDES });
      await refreshState();
    } catch (e) {
      alert(SSS.I18n.t('popupClearFail', { msg: e.message }));
    }
  });

  document.getElementById('toggleRulerBtn').addEventListener('click', async () => {
    try {
      await sendToTab({ type: MSG.TOGGLE_RULER });
      await refreshState();
    } catch (e) {
      alert(SSS.I18n.t('popupToggleFail', { msg: e.message }));
    }
  });
}

// 初始化：先应用语言并渲染文案，再绑定事件与刷新状态
applyLanguage().then(() => {
  bindEvents();
  refreshState();
});
