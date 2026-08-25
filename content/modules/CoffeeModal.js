/**
 * CoffeeModal 模块 — 请喝咖啡模态框
 * 
 * 职责：
 * - 展示作者的微信赞赏码
 * - 提供精美、可爱的视觉交互界面
 */

(function () {
  class CoffeeModal {
    constructor(host) {
      this.host = host;
      this._el = null;
      this._hideTimer = null;
    }

    show() {
      this._build();
    }

    hide() {
      // 取消任何尚未触发的隐藏定时器，避免其误删新构建的模态框
      if (this._hideTimer) {
        clearTimeout(this._hideTimer);
        this._hideTimer = null;
      }
      const el = this._el;
      if (!el) return;
      this._el = null;
      el.classList.add('sss-modal-fade-out');
      this._hideTimer = setTimeout(() => {
        el.remove();
        this._hideTimer = null;
      }, 300);
    }

    _build() {
      // 取消旧的隐藏定时器，确保新模态框不会被上一次 hide() 的定时器误删
      if (this._hideTimer) {
        clearTimeout(this._hideTimer);
        this._hideTimer = null;
      }

      const overlay = document.createElement('div');
      overlay.className = 'sss-modal-overlay sss-coffee-overlay';
      
      const imgUrl = chrome.runtime.getURL('assets/pay_coffee.jpg');
      const i18n = SSS.I18n;
      
      overlay.innerHTML = `
        <div class="sss-modal sss-coffee-modal">
          <div class="sss-coffee-header">
            <div class="sss-coffee-icon">☕️</div>
            <div class="sss-modal-title">${i18n.t('coffeeTitle')}</div>
            <div class="sss-coffee-subtitle">${i18n.t('coffeeSubtitle')} ✨</div>
          </div>
          
          <div class="sss-coffee-content">
            <div class="sss-qr-container">
              <img src="${imgUrl}" alt="微信赞赏码" class="sss-qr-code" />
              <div class="sss-qr-decoration"></div>
            </div>
          </div>
          
          <div class="sss-modal-actions">
            <button class="sss-btn sss-btn-primary sss-close-btn">
              ${i18n.t('coffeeClose')}
            </button>
          </div>
          
          <div class="sss-coffee-footer">
            Made with ❤️ for efficiency
          </div>
        </div>
      `;

      this._el = overlay;

      overlay.querySelector('.sss-close-btn').addEventListener('click', () => {
        this.hide();
      });

      overlay.addEventListener('pointerdown', (e) => {
        if (e.target === overlay) {
          this.hide();
        }
        e.stopPropagation();
      });

      this.host.appendChild(overlay);
    }
  }

  SSS.CoffeeModal = CoffeeModal;
})();
