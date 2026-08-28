/**
 * SettingsModal 模块 — 设置模态框
 *
 * 职责：
 * - 提供选区框快捷键的配置
 * - 提供界面语言（Language）的选择
 * - 持久化设置到 chrome.storage
 */

(function () {
  class SettingsModal {
    constructor(host, storage) {
      this.host = host;
      this.storage = storage;
      this._el = null;
      this.onShortcutChange = null;
      this.onLanguageChange = null;
      this.onOpenHowTo = null; // 打开“如何使用”讲解模态框

      this._settings = {
        selectionShortcut: 'p',
        language: SSS.I18n.lang,
        menuVisible: true, // 默认开启
      };
    }

    async setMenuVisible(visible) {
      this._settings.menuVisible = !!visible;
      await this.save();
    }

    get menuVisible() {
      return this._settings.menuVisible !== false; // 默认为 true
    }

    async load() {
      try {
        const data = await this.storage.get(SSS.SETTINGS_KEY);
        const saved = data?.[SSS.SETTINGS_KEY];
        if (saved && typeof saved === 'object') {
          this._settings = { ...this._settings, ...saved };
        }
        // 初始化界面语言：优先取已保存的语言，否则根据浏览器语言检测
        if (!this._settings.language) {
          this._settings.language = SSS.I18n.detectLanguage();
        }
        SSS.I18n.setLanguage(this._settings.language);
      } catch (e) {
        console.warn('[SSS] 加载设置失败:', e);
      }
      return this._settings;
    }

    async save() {
      try {
        await this.storage.set({ [SSS.SETTINGS_KEY]: this._settings });
        this.onShortcutChange?.(this._settings.selectionShortcut);
        this.onLanguageChange?.(this._settings.language);
      } catch (e) {
        console.error('[SSS] 保存设置失败:', e);
      }
    }

    show() {
      this._build();
    }

    hide() {
      this._el?.remove();
      this._el = null;
    }

    _build() {
      this.hide();

      const i18n = SSS.I18n;
      const overlay = document.createElement('div');
      overlay.className = 'sss-modal-overlay';
      overlay.innerHTML = `
        <div class="sss-modal sss-settings-modal">
          <div class="sss-modal-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
            ${i18n.t('settingsTitle')}
          </div>
          <div class="sss-settings-content">
            <div class="sss-setting-item">
              <div class="sss-setting-label">${i18n.t('settingsShortcutLabel')}</div>
              <div class="sss-setting-control">
                <div class="sss-shortcut-input" tabindex="0">${this._settings.selectionShortcut.toUpperCase()}</div>
                <div class="sss-setting-tip">${i18n.t('settingsShortcutTip')}</div>
              </div>
            </div>
            <div class="sss-setting-item">
              <div class="sss-setting-label">${i18n.t('settingsLanguageLabel')}</div>
              <div class="sss-setting-control">
                <select class="sss-language-select">
                  ${i18n.languages
                    .map(
                      (l) =>
                        `<option value="${l.code}" ${l.code === this._settings.language ? 'selected' : ''}>${l.label}</option>`
                    )
                    .join('')}
                </select>
                <div class="sss-setting-tip">${i18n.t('settingsLanguageTip')}</div>
              </div>
            </div>
          </div>
          <div class="sss-modal-actions sss-settings-actions">
            <button class="sss-btn sss-btn-secondary sss-howto-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              ${i18n.t('settingsHowTo')}
            </button>
            <button class="sss-btn sss-btn-primary sss-save-btn">${i18n.t('settingsSave')}</button>
            <button class="sss-btn sss-btn-secondary sss-close-btn">${i18n.t('settingsClose')}</button>
          </div>
        </div>
      `;

      this._el = overlay;
      const shortcutInput = overlay.querySelector('.sss-shortcut-input');
      const languageSelect = overlay.querySelector('.sss-language-select');

      shortcutInput.addEventListener('keydown', (e) => {
        e.preventDefault();
        e.stopPropagation();

        // 忽略功能键
        if (['Control', 'Shift', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) return;

        const newKey = e.key.toLowerCase();
        this._settings.selectionShortcut = newKey;
        shortcutInput.textContent = newKey.toUpperCase();
        shortcutInput.classList.add('sss-shortcut-changed');
      });

      languageSelect.addEventListener('change', () => {
        this._settings.language = languageSelect.value;
        // 立即切换界面语言并重新渲染当前模态框
        SSS.I18n.setLanguage(this._settings.language);
        this.onLanguageChange?.(this._settings.language);
        this.show();
      });

      overlay.querySelector('.sss-save-btn').addEventListener('click', () => {
        this.save();
        this.hide();
      });

      overlay.querySelector('.sss-close-btn').addEventListener('click', () => {
        this.hide();
      });

      // 点击“如何使用”时，打开讲解模态框
      overlay.querySelector('.sss-howto-btn').addEventListener('click', () => {
        this.onOpenHowTo?.();
      });

      overlay.addEventListener('pointerdown', (e) => e.stopPropagation());

      this.host.appendChild(overlay);
      shortcutInput.focus();
    }

    get selectionShortcut() {
      return this._settings.selectionShortcut;
    }

    get language() {
      return this._settings.language;
    }
  }

  SSS.SettingsModal = SettingsModal;
})();
