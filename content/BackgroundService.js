/**
 * BackgroundService 模块 — Content Script 与 Background 通信封装
 *
 * 高内聚：所有跨端消息发送逻辑集中于此；
 * 低耦合：对上层隐藏 chrome.runtime 细节，返回统一的 Promise。
 */

(function () {
  class BackgroundService {
    constructor() {
      this._send = (message) =>
        new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            if (response && response.ok === false) {
              reject(new Error(response.error || '后台处理失败'));
              return;
            }
            resolve(response);
          });
        });
    }

    /**
     * 获取当前视口截图
     * @returns {Promise<{dataUrl:string}>}
     */
    captureVisibleTab() {
      return this._send({ type: SSS.MSG.CAPTURE_VISIBLE_TAB });
    }

    /**
     * 触发 PNG 下载
     * @param {string} dataUrl
     * @param {string} filename
     * @returns {Promise<Object>}
     */
    downloadPng(dataUrl, filename) {
      return this._send({ type: SSS.MSG.DOWNLOAD_PNG, dataUrl, filename });
    }
  }

  SSS.BackgroundService = BackgroundService;
})();
