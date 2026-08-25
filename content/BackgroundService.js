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
     *
     * 为避免超大 data URL 通过 chrome.runtime.sendMessage 一次性传输时被截断或损坏
     * （大尺寸 PNG 的 base64 字符串可达到数十 MB，单条消息传输不可靠），
     * 这里将 dataUrl 按固定大小切成多个 chunk 分段发送，全部发送完成后通知后台组装并下载。
     *
     * @param {string} dataUrl PNG 的 data URL
     * @param {string} filename 目标文件名（含 .png 后缀）
     * @returns {Promise<Object>}
     */
    async downloadPng(dataUrl, filename) {
      const CHUNK_SIZE = 4 * 1024 * 1024; // 单条消息最大携带的字符数（4MB）
      // base64 每个字符都是单字节，可按字符边界安全切分
      const chunks = [];
      for (let i = 0; i < dataUrl.length; i += CHUNK_SIZE) {
        chunks.push(dataUrl.slice(i, i + CHUNK_SIZE));
      }

      // 顺序逐块发送，保证到达顺序与拼接正确
      for (let i = 0; i < chunks.length; i++) {
        await this._send({
          type: SSS.MSG.DOWNLOAD_CHUNK,
          filename,
          chunkCount: chunks.length,
          index: i,
          chunk: chunks[i],
        });
      }

      // 全部发送完成后通知后台组装 Blob 并触发下载
      return this._send({
        type: SSS.MSG.DOWNLOAD_ASSEMBLE,
        filename,
        chunkCount: chunks.length,
      });
    }

    /**
     * 打开默认下载文件夹
     * @returns {Promise<Object>}
     */
    openDownloadsFolder() {
      return this._send({ type: SSS.MSG.OPEN_DOWNLOADS_FOLDER });
    }
  }

  SSS.BackgroundService = BackgroundService;
})();
