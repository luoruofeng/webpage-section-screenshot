/**
 * Storage 模块 — chrome.storage.local 封装
 *
 * 高内聚：存储读写逻辑集中于此；
 * 低耦合：对外提供统一的 Promise 化 get/set 接口，便于替换实现。
 */

(function () {
  class Storage {
    constructor() {
      this.api = chrome?.storage?.local ?? null;
    }

    /**
     * 读取存储
     * @param {string} key
     * @returns {Promise<Object|null>}
     */
    get(key) {
      return new Promise((resolve, reject) => {
        if (!this.api) {
          reject(new Error('chrome.storage 不可用'));
          return;
        }
        this.api.get(key, (result) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve(result ?? null);
        });
      });
    }

    /**
     * 写入存储
     * @param {Object} data
     * @returns {Promise<void>}
     */
    set(data) {
      return new Promise((resolve, reject) => {
        if (!this.api) {
          reject(new Error('chrome.storage 不可用'));
          return;
        }
        this.api.set(data, () => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          resolve();
        });
      });
    }
  }

  SSS.Storage = Storage;
})();
