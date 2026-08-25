/**
 * HowToUseModal 模块 — “如何使用”讲解模态框
 *
 * 职责：
 * - 提供插件使用方法的入门讲解，按步骤分章节展示操作流程
 * - 提供一个独立于界面语言的下拉框，用于切换讲解的语言
 * - 将用户最后选择的讲解语言持久化到 chrome.storage
 *
 * 设计说明：
 * - 讲解内容（guide）由 I18n 模块以各语言译文直接提供，
 *   完全由大模型输出，不依赖任何脚本或在线翻译生成。
 * - 讲解语言与界面语言解耦：即使界面是中文，也可将讲解切换为英文。
 *
 * 高内聚：讲解 UI 与语言切换逻辑全部封装于此；
 * 低耦合：通过 I18n.getGuide(lang) 获取内容，不关心翻译细节。
 */

(function () {
  // 讲解语言持久化存储键
  const HOWTO_LANG_KEY = 'sss_howto_lang';

  class HowToUseModal {
    constructor(host, storage) {
      this.host = host;
      this.storage = storage;
      this._el = null;
      // 讲解语言：默认跟随界面语言，可由下拉框独立切换
      this._lang = SSS.I18n.lang;
    }

    /**
     * 打开讲解模态框
     */
    async show() {
      // 读取上次选择的讲解语言（若无则跟随界面语言）
      try {
        const data = await this.storage.get(HOWTO_LANG_KEY);
        const saved = data?.[HOWTO_LANG_KEY];
        if (saved && SSS.I18n.languages.some((l) => l.code === saved)) {
          this._lang = saved;
        }
      } catch (e) {
        console.warn('[SSS] 读取讲解语言失败:', e);
      }
      this._build();
    }

    hide() {
      this._el?.remove();
      this._el = null;
    }

    /**
     * 持久化当前选择的讲解语言
     */
    _persist() {
      this.storage.set({ [HOWTO_LANG_KEY]: this._lang }).catch((e) => {
        console.warn('[SSS] 保存讲解语言失败:', e);
      });
    }

    _build() {
      this.hide();

      const i18n = SSS.I18n;
      const overlay = document.createElement('div');
      overlay.className = 'sss-modal-overlay sss-howto-overlay';
      overlay.innerHTML = `
        <div class="sss-modal sss-howto-modal">
          <div class="sss-modal-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            ${i18n.t('howtoTitle')}
          </div>
          <div class="sss-howto-langbar">
            <label class="sss-howto-lang-label" for="sss-howto-lang-select">${i18n.t('howtoLangLabel')}</label>
            <select id="sss-howto-lang-select" class="sss-howto-lang-select">
              ${i18n.languages
                .map(
                  (l) =>
                    `<option value="${l.code}" ${l.code === this._lang ? 'selected' : ''}>${l.label}</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="sss-howto-content"></div>
          <div class="sss-modal-actions">
            <button class="sss-btn sss-btn-secondary sss-close-btn">${i18n.t('howtoClose')}</button>
          </div>
        </div>
      `;

      this._el = overlay;
      const contentEl = overlay.querySelector('.sss-howto-content');
      this._renderGuide(contentEl);

      const langSelect = overlay.querySelector('.sss-howto-lang-select');
      langSelect.addEventListener('change', () => {
        this._lang = langSelect.value;
        this._persist();
        this._renderGuide(contentEl);
      });

      overlay.querySelector('.sss-close-btn').addEventListener('click', () => this.hide());

      // 阻止事件冒泡，防止触发页面其他逻辑
      overlay.addEventListener('pointerdown', (e) => e.stopPropagation());

      this.host.appendChild(overlay);
    }

    /**
     * 按当前讲解语言渲染指南内容
     * @param {HTMLElement} container 内容容器
     */
    _renderGuide(container) {
      const guide = SSS.I18n.getGuide(this._lang);
      container.innerHTML = guide
        .map(
          (section) => `
            <section class="sss-howto-section">
              <h3 class="sss-howto-section-title">${section.title}</h3>
              <ol class="sss-howto-steps">
                ${section.steps.map((step) => `<li class="sss-howto-step">${step}</li>`).join('')}
              </ol>
            </section>
          `
        )
        .join('');
    }
  }

  SSS.HowToUseModal = HowToUseModal;
})();
