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
     * 生成第 index 张 PNG 的文件名
     * @param {number} index 序号（从 1 开始）
     * @param {string} url 页面 URL
     * @returns {string} 例如 `1_mywebsite.png`
     */
    static build(index, url) {
      const base = Naming.pageNameFromUrl(url);
      return `${index}_${base}.png`;
    }
  }

  SSS.Naming = Naming;
})();
