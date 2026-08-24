/**
 * Toolbar 模块 — 页面内浮动工具条
 *
 * 职责：
 * - 提供开始裁切 PNG、清空参考线、显示/隐藏标尺、统计信息等操作入口
 * - 不打开 Popup 也可直接操作
 *
 * 高内聚：工具条 UI 与按钮事件绑定全部封装于此；
 * 低耦合：通过回调注入各操作，不直接依赖其它模块实现。
 */

(function () {
  class Toolbar {
    constructor(host) {
      this.host = host;
      this.onStart = null; // 开始裁切
      this.onClear = null; // 清空参考线
      this.onToggleRuler = null; // 切换标尺
      this._el = null;
      this._guideCountEl = null;
      this._toggleBtn = null;
      this._build();
    }

    _build() {
      const el = document.createElement('div');
      el.className = 'sss-toolbar';
      el.innerHTML = `
        <button class="sss-btn sss-btn-primary sss-start-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/></svg>
          开始裁切 PNG
        </button>
        <button class="sss-btn sss-btn-secondary sss-clear-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          清空参考线
        </button>
        <button class="sss-btn sss-btn-secondary sss-toggle-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M12 3v18"/></svg>
          隐藏标尺
        </button>
        <div class="sss-guide-count" style="text-align:center;font-size:12px;color:#6b7280;">参考线：0 条</div>
      `;
      this._el = el;
      this._guideCountEl = el.querySelector('.sss-guide-count');
      this._toggleBtn = el.querySelector('.sss-toggle-btn');

      el.querySelector('.sss-start-btn').addEventListener('click', () => this.onStart?.());
      el.querySelector('.sss-clear-btn').addEventListener('click', () => this.onClear?.());
      this._toggleBtn.addEventListener('click', () => this.onToggleRuler?.());

      this.host.appendChild(el);
    }

    /**
     * 更新“显示/隐藏标尺”按钮文案
     * @param {boolean} rulerVisible 标尺当前是否可见
     */
    updateToggleLabel(rulerVisible) {
      if (this._toggleBtn) {
        this._toggleBtn.textContent = rulerVisible ? '隐藏标尺' : '显示标尺';
      }
    }

    /**
     * 更新参考线数量显示
     * @param {number} count
     */
    setGuideCount(count) {
      if (this._guideCountEl) this._guideCountEl.textContent = `参考线：${count} 条`;
    }

    /**
     * 显示 / 隐藏工具条
     * @param {boolean} visible
     */
    setVisible(visible) {
      if (this._el) this._el.style.display = visible ? '' : 'none';
    }

    destroy() {
      this._el?.remove();
      this._el = null;
    }
  }

  SSS.Toolbar = Toolbar;
})();
