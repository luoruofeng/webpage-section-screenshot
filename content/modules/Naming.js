/**
 * Naming 模块 — PNG 文件命名规则
 *
 * 命名格式：`序号_网页名称.png`
 * 示例：`1_mywebsite.png`、`2_mywebsite.png`
 *
 * 高内聚：命名相关的 URL 解析、非法字符过滤、序号拼接全部封装于此。
 */

(function () {
  class Naming {
    /**
     * 从当前页面 URL 解析出网页名称
     * @param {string} url 页面 URL
     * @returns {string} 合法文件名片段
     */
    static pageNameFromUrl(url = location.href) {
      try {
        const parsed = new URL(url);
        const host = parsed.hostname;
        // 去掉顶级域名后缀，如 mywebsite.com -> mywebsite
        let name = host.replace(/^www\./, '');
        const domainMatch = name.match(
          /^(.*?)\.(?:com|cn|net|org|io|co|dev|app|me|info|biz|tv|cc|top|xyz|online|site|shop|store|tech)$/
        );
        if (domainMatch) name = domainMatch[1];

        // 若 host 为空或解析失败，回退用 URL 原文片段
        if (!name) {
          name = parsed.pathname.replace(/[^a-zA-Z0-9-_]/g, '_') || 'page';
        }
        return Naming.sanitize(name);
      } catch (e) {
        // 无法解析时使用默认名称
        return Naming.sanitize('page');
      }
    }

    /**
     * 清理非法文件名字符（Windows/Linux 通用）
     * @param {string} str
     * @returns {string}
     */
    static sanitize(str) {
      return (
        String(str)
          .replace(/[\\/:*?"<>|]/g, '_')
          .replace(/\s+/g, '_')
          .replace(/_{2,}/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 60) || 'page'
      );
    }

    /**
     * 生成保存文件夹名（按当前时间，年月日时分秒及毫秒的可读格式）
     * 附加毫秒和随机字符以确保在同一秒内多次点击时文件路径不冲突，避免离屏文档缓冲区污染。
     * @param {Date} [date] 时间（默认为当前时间）
     * @returns {string} 例如 `2026年08月25日 14时30分55秒_500_A1B2`
     */
    static folderName(date = new Date()) {
      const pad = (n) => String(n).padStart(2, '0');
      const ms = String(date.getMilliseconds()).padStart(3, '0');
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return (
        `${date.getFullYear()}年${pad(date.getMonth() + 1)}月${pad(date.getDate())}日 ` +
        `${pad(date.getHours())}时${pad(date.getMinutes())}分${pad(date.getSeconds())}秒_${ms}_${random}`
      );
    }

    /**
     * 生成第 index 张 PNG 的文件名（可附带同一保存文件夹前缀）
     * @param {number} index 序号（从 1 开始）
     * @param {string} url 页面 URL
     * @param {string} [folder] 保存文件夹名（同一批图片共用同一个）
     * @returns {string} 例如 `1_mywebsite.png` 或 `2026年08月25日 14时30分55秒/1_mywebsite.png`
     */
    static build(index, url, folder) {
      const base = Naming.pageNameFromUrl(url);
      const name = `${index}_${base}.png`;
      return folder ? `${folder}/${name}` : name;
    }
  }

  SSS.Naming = Naming;
})();
