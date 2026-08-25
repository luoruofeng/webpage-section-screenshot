/**
 * ClassSelectionModal 模块 — 按 Class 自动添加选区模态框
 *
 * 职责：
 * - 提供输入框让用户输入 class 名字
 * - 点击确认后，回调给外部进行元素查找与选区添加
 */

(function () {
  class ClassSelectionModal {
    constructor(host) {
      this.host = host;
      this._el = null;
      this.onConfirm = null; // 用户点击确认时的回调
    }

    show() {
      this._build();
    }

    hide() {
      if (this._el) {
        this._el.remove();
        this._el = null;
      }
    }

    _build() {
      this.hide();

      const i18n = SSS.I18n;
      const overlay = document.createElement('div');
      overlay.className = 'sss-modal-overlay';
      overlay.innerHTML = `
        <div class="sss-modal sss-class-selection-modal">
          <div class="sss-modal-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" stroke-dasharray="4 2"/>
              <path d="M12 8v8M8 12h8"/>
            </svg>
            ${i18n.t('classTitle')}
          </div>
          <div class="sss-modal-content">
            <div class="sss-input-group">
              <label class="sss-input-label">${i18n.t('classInputLabel')}</label>
              <div class="sss-input-wrapper">
                <span class="sss-input-prefix">.</span>
                <input type="text" class="sss-class-input" placeholder="${i18n.t('classInputPlaceholder')}" autofocus>
              </div>
              <div class="sss-input-tip">${i18n.t('classInputTip')}</div>
            </div>
          </div>
          <div class="sss-modal-actions">
            <button class="sss-btn sss-btn-primary sss-confirm-btn">${i18n.t('classConfirm')}</button>
            <button class="sss-btn sss-btn-secondary sss-close-btn">${i18n.t('classCancel')}</button>
          </div>
        </div>
      `;

      this._el = overlay;
      const input = overlay.querySelector('.sss-class-input');
      
      const handleConfirm = () => {
        const className = input.value.trim();
        if (className) {
          this.onConfirm?.(className);
          this.hide();
        } else {
          input.focus();
        }
      };

      overlay.querySelector('.sss-confirm-btn').addEventListener('click', handleConfirm);
      overlay.querySelector('.sss-close-btn').addEventListener('click', () => this.hide());
      
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          handleConfirm();
        } else if (e.key === 'Escape') {
          this.hide();
        }
      });

      // 阻止事件冒泡，防止触发页面其他逻辑
      overlay.addEventListener('pointerdown', (e) => e.stopPropagation());

      this.host.appendChild(overlay);
      
      // 自动聚焦
      setTimeout(() => input.focus(), 50);
    }
  }

  SSS.ClassSelectionModal = ClassSelectionModal;
})();
