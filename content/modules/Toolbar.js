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
      this.onToggleSelection = null; // 切换选区框模式
      this.onAutoSelection = null; // 自动选区 (Class)
      this.onDomInspect = null; // 检查 DOM 元素
      this.onOpenSettings = null; // 打开设置
      this.onOpenCoffee = null; // 请喝咖啡
      this.onClose = null; // 关闭插件（与点击插件图标一致）
      this._el = null;
      this._guideCountEl = null;
      this._toggleBtn = null;
      this._selectionBtn = null;
      this._domInspectBtn = null;
      this._selectionActive = false;
      this._domInspectActive = false;
      this._shortcut = 'P';
      this._rulerVisible = true;
      this._guideCount = 0;
      this._build();
    }

    _build() {
      const i18n = SSS.I18n;
      const el = document.createElement('div');
      el.className = 'sss-toolbar';
      el.innerHTML = `
        <button class="sss-btn sss-btn-primary sss-start-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.09-3.09a2 2 0 0 0-2.82 0L6 21"/></svg>
          ${i18n.t('toolbarStart')}
        </button>
        <button class="sss-btn sss-btn-secondary sss-clear-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
          ${i18n.t('toolbarClear')}
        </button>
        <button class="sss-btn sss-btn-secondary sss-selection-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 2"/></svg>
          ${i18n.t('toolbarSelectionOn')} (${this._shortcut})
        </button>
        <button class="sss-btn sss-btn-secondary sss-auto-selection-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 2"/><path d="M12 8v8M8 12h8"/></svg>
          ${i18n.t('toolbarAutoSelection')}
        </button>
        <button class="sss-btn sss-btn-secondary sss-dom-inspect-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/><path d="M8 10.5h5"/></svg>
          ${i18n.t('toolbarDomInspect')}
        </button>
        <button class="sss-btn sss-btn-secondary sss-toggle-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18M12 3v18"/></svg>
          ${i18n.t('toolbarToggleOn')}
        </button>
        <button class="sss-btn sss-btn-secondary sss-settings-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          ${i18n.t('toolbarSettings')}
        </button>
        <button class="sss-btn sss-btn-coffee sss-coffee-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
          ${i18n.t('toolbarCoffee')}
        </button>
        <button class="sss-btn sss-btn-secondary sss-close-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          ${i18n.t('toolbarClose')}
        </button>
        <div class="sss-guide-count" style="text-align:center;font-size:12px;color:#6b7280;">${i18n.t('guideCount', { count: 0 })}</div>
      `;
      this._el = el;
      this._guideCountEl = el.querySelector('.sss-guide-count');
      this._toggleBtn = el.querySelector('.sss-toggle-btn');
      this._selectionBtn = el.querySelector('.sss-selection-btn');
      this._domInspectBtn = el.querySelector('.sss-dom-inspect-btn');

      el.querySelector('.sss-start-btn').addEventListener('click', () => this.onStart?.());
      el.querySelector('.sss-clear-btn').addEventListener('click', () => this.onClear?.());
      el.querySelector('.sss-settings-btn').addEventListener('click', () => this.onOpenSettings?.());
      el.querySelector('.sss-coffee-btn').addEventListener('click', () => this.onOpenCoffee?.());
      el.querySelector('.sss-close-btn').addEventListener('click', () => this.onClose?.());
      this._toggleBtn.addEventListener('click', () => this.onToggleRuler?.());
      this._selectionBtn.addEventListener('click', () => {
        this._selectionActive = !this._selectionActive;
        this.updateSelectionState(this._selectionActive);
        this.onToggleSelection?.(this._selectionActive);
      });
      el.querySelector('.sss-auto-selection-btn').addEventListener('click', () => this.onAutoSelection?.());
      this._domInspectBtn.addEventListener('click', () => {
        const next = !this._domInspectActive;
        this.updateDomInspectState(next);
        this.onDomInspect?.(next);
      });

      this.host.appendChild(el);
    }

    /**
     * 更新选区框按钮状态
     * @param {boolean} active
     */
    updateSelectionState(active) {
      this._selectionActive = active;
      if (this._selectionBtn) {
        this._selectionBtn.textContent = `${SSS.I18n.t(active ? 'toolbarSelectionOff' : 'toolbarSelectionOn')} (${this._shortcut})`;
        // 添加一个激活样式的类名
        if (active) {
          this._selectionBtn.classList.add('sss-btn-active');
        } else {
          this._selectionBtn.classList.remove('sss-btn-active');
        }
      }
    }

    /**
     * 更新“检查 DOM 元素”按钮的激活状态
     * 按钮文案保持不变，仅通过高亮样式表示当前处于检查状态
     * @param {boolean} active
     */
    updateDomInspectState(active) {
      this._domInspectActive = active;
      if (this._domInspectBtn) {
        this._domInspectBtn.classList.toggle('sss-btn-active', active);
      }
    }

    /**
     * 更新快捷键显示
     * @param {string} shortcut
     */
    updateShortcut(shortcut) {
      this._shortcut = shortcut.toUpperCase();
      this.updateSelectionState(this._selectionActive);
    }

    /**
     * 更新“显示/隐藏标尺”按钮文案
     * @param {boolean} rulerVisible 标尺当前是否可见
     */
    updateToggleLabel(rulerVisible) {
      this._rulerVisible = rulerVisible;
      if (this._toggleBtn) {
        this._toggleBtn.textContent = SSS.I18n.t(
          rulerVisible ? 'toolbarToggleOn' : 'toolbarToggleOff'
        );
      }
    }

    /**
     * 更新参考线数量显示
     * @param {number} count
     */
    setGuideCount(count) {
      this._guideCount = count;
      if (this._guideCountEl)
        this._guideCountEl.textContent = SSS.I18n.t('guideCount', { count });
    }

    /**
     * 语言切换后刷新所有文案（不重建 DOM，仅更新文本节点）
     */
    refreshTexts() {
      const i18n = SSS.I18n;
      if (this._el) {
        this._el.querySelector('.sss-start-btn').lastChild.textContent = i18n.t('toolbarStart');
        this._el.querySelector('.sss-clear-btn').lastChild.textContent = i18n.t('toolbarClear');
        this._el.querySelector('.sss-auto-selection-btn').lastChild.textContent =
          i18n.t('toolbarAutoSelection');
        this._el.querySelector('.sss-dom-inspect-btn').lastChild.textContent =
          i18n.t('toolbarDomInspect');
        this._el.querySelector('.sss-settings-btn').lastChild.textContent =
          i18n.t('toolbarSettings');
        this._el.querySelector('.sss-coffee-btn').lastChild.textContent = i18n.t('toolbarCoffee');
        this._el.querySelector('.sss-close-btn').lastChild.textContent = i18n.t('toolbarClose');
      }
      this.updateSelectionState(this._selectionActive);
      this.updateToggleLabel(this._rulerVisible);
      this.setGuideCount(this._guideCount);
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
