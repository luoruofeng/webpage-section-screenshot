/**
 * Content Script 入口
 *
 * 职责：组装所有模块（依赖注入），完成模块间的连接，不包含业务实现。
 * 高内聚低耦合：各模块独立，入口仅负责“装配”与“路由”。
 *
 * 非模块化模式：所有模块挂载在全局 SSS 命名空间上（由 manifest 按依赖顺序加载），
 * 入口文件最后加载，负责实例化与装配。
 *
 * 使用 Shadow DOM 隔离样式，避免污染宿主页面。
 */

(function () {
  /**
   * 应用装配器
   */
  class App {
    constructor() {
      // 创建 Shadow DOM 宿主（挂载在 documentElement 下，保证层级最高）
      this._initShadow();

      // 初始化界面语言：先按浏览器语言设置默认值，
      // 随后 settingsModal.load() 会用已保存的语言覆盖（若有）。
      SSS.I18n.setLanguage(SSS.I18n.detectLanguage());

      this.background = new SSS.BackgroundService();
      this.storage = new SSS.Storage();

      this.ruler = new SSS.Ruler(this.shadow, SSS.RULER_SIZE);
      this.guides = new SSS.GuideManager(this.shadow, this.storage);
      this.selections = new SSS.SelectionManager(this.shadow);
      this.progressModal = new SSS.ProgressModal(this.shadow);
      this.settingsModal = new SSS.SettingsModal(this.shadow, this.storage);
      this.howToUseModal = new SSS.HowToUseModal(this.shadow, this.storage);
      this.coffeeModal = new SSS.CoffeeModal(this.shadow);
      this.classSelectionModal = new SSS.ClassSelectionModal(this.shadow);
      this.screenshot = new SSS.ScreenshotManager(this.background, this.progressModal);
      this.toolbar = new SSS.Toolbar(this.shadow);

      // 主菜单（工具条）显隐状态：默认显示（稍后会从存储中同步）
      this._menuVisible = true;

      this._wire();
    }

    /**
     * 创建 Shadow DOM 根节点
     */
    _initShadow() {
      this.hostEl = document.createElement('div');
      this.hostEl.id = 'sss-shadow-host';
      // 初始隐藏，待设置加载后再根据状态显示，避免闪烁
      this.hostEl.style.cssText =
        'all:initial;position:fixed;top:0;left:0;z-index:2147483000;display:none;';
      document.documentElement.appendChild(this.hostEl);
      this.shadow = this.hostEl.attachShadow({ mode: 'open' });

      // 注入样式
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = chrome.runtime.getURL('content/style.css');
      this.shadow.appendChild(link);
    }

    /**
     * 连接模块间关系
     */
    _wire() {
      // 标尺 -> 参考线：拖拽创建
      this.ruler.onDragStart = (data) => {
        // 从标尺拖动参考线时，自动关闭选区状态
        if (this.selections.active) {
          this.selections.setActive(false);
          this.toolbar.updateSelectionState(false);
        }
        this.guides.startDrag(data);
      };
      this.ruler.onDragMove = (x, y) => this.guides.moveDrag(x, y);
      this.ruler.onDragEnd = (x, y) => this.guides.endDrag(x, y);

      // 标尺拖拽的 move/end 需要全局监听
      this._bindGlobalEvents();

      // 参考线变化 -> 工具条统计
      this.guides.onChange = (list) => this.toolbar.setGuideCount(list.length);

      // 进度模态框取消 -> 截图管理器取消
      this.progressModal.onCancel = () => this.screenshot.cancel();

      // 工具条按钮
      this.toolbar.onStart = () => this._handleStart();
      this.toolbar.onClear = () => {
        this.guides.clearAll();
        this.selections.clearAll();
      };
      this.toolbar.onToggleRuler = () => {
        this.ruler.setVisible(!this.ruler.visible);
        this.toolbar.updateToggleLabel?.(this.ruler.visible);
      };
      this.toolbar.onToggleSelection = (active) => {
        this.selections.setActive(active);
      };
      this.toolbar.onOpenSettings = () => {
        this.settingsModal.show();
      };
      this.toolbar.onOpenCoffee = () => {
        this.coffeeModal.show();
      };
      this.toolbar.onAutoSelection = () => {
        this.classSelectionModal.show();
      };

      this.classSelectionModal.onConfirm = (className) => {
        const count = this.selections.addSelectionByClass(className);
        if (count > 0) {
          this._notify(SSS.I18n.t('notifyClassAdded', { className, count }), 'info');
        } else {
          this._notify(SSS.I18n.t('notifyClassNotFound', { className }));
        }
      };

      this.settingsModal.onShortcutChange = (newShortcut) => {
        this.toolbar.updateShortcut(newShortcut);
      };

      // 打开“如何使用”讲解模态框
      this.settingsModal.onOpenHowTo = () => {
        this.howToUseModal.show();
      };

      // 界面语言变化：刷新所有模块的文案
      SSS.I18n.onLanguageChange = () => {
        this.toolbar.refreshTexts();
        this.selections.refreshTexts();
      };

      // 截图回调：错误信息已由 ScreenshotManager 在模态框内 showError 展示，
      // 此处仅补充日志，避免与 _handleStart 的 catch 重复弹提示。
      this.screenshot.onError = (err) => {
        console.error('[SSS] 截图失败:', err);
      };

      // Popup 消息监听
      this._listenMessages();

      // 初始化加载持久化的参考线与设置
      this.guides.load().then(() => {
        this.toolbar.setGuideCount(this.guides.count);
      });
      this.settingsModal.load().then((settings) => {
        this.toolbar.updateShortcut(settings.selectionShortcut);
        // 同步持久化的主菜单显隐状态
        this._menuVisible = this.settingsModal.menuVisible;
        this._setUiVisible(this._menuVisible);
        // 加载完成后显示宿主元素
        if (this.hostEl) this.hostEl.style.display = 'block';
      });
    }

    /**
     * 全局监听标尺拖拽与选区框拖拽
     */
    _bindGlobalEvents() {
      this._onPointerDown = (e) => {
        if (!this.selections.active) return;
        // 仅响应左键
        if (e.button !== 0) return;
        
        const scrollX = window.scrollX || document.documentElement.scrollLeft;
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        this.selections.startDrag(e.clientX, e.clientY, scrollX, scrollY);
      };

      this._onPointerMove = (e) => {
        // 标尺拖拽
        this.ruler.onDragMove?.(e.clientX, e.clientY);
        
        // 选区框逻辑
        if (this.selections.active) {
          const scrollX = window.scrollX || document.documentElement.scrollLeft;
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          
          // 如果正在拖拽选区，更新预览框
          this.selections.moveDrag(e.clientX, e.clientY, scrollX, scrollY);
          
          // 始终更新鼠标提示位置
          this.selections.updateCursor(e.clientX, e.clientY, scrollX, scrollY);
        }
      };

      this._onPointerUp = (e) => {
        // 标尺拖拽结束
        this.ruler.onDragEnd?.(e.clientX, e.clientY);
        
        // 选区框拖拽结束
        if (this.selections.active) {
          const scrollX = window.scrollX || document.documentElement.scrollLeft;
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          this.selections.endDrag(e.clientX, e.clientY, scrollX, scrollY);
        }
      };

      window.addEventListener('pointerdown', this._onPointerDown);
      window.addEventListener('pointermove', this._onPointerMove);
      window.addEventListener('pointerup', this._onPointerUp);

      // 全局快捷键监听
      window.addEventListener('keydown', (e) => {
        // 如果正在输入（例如在设置框内），则不触发快捷键
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable || e.target.classList.contains('sss-shortcut-input')) {
          return;
        }

        const shortcut = this.settingsModal.selectionShortcut.toLowerCase();
        if (e.key.toLowerCase() === shortcut) {
          e.preventDefault();
          const nextActive = !this.selections.active;
          this.selections.setActive(nextActive);
          this.toolbar.updateSelectionState(nextActive);
        }

        // 按 ESC 关闭选区状态
        if (e.key === 'Escape') {
          if (this.selections.active) {
            this.selections.setActive(false);
            this.toolbar.updateSelectionState(false);
          }
        }
      });
    }

    /**
     * 切换主菜单（工具条）的显示 / 隐藏，并同步控制标尺的显示 / 隐藏
     * 主菜单隐藏时标尺同步隐藏；主菜单显示时标尺同步显示。
     * @returns {boolean} 切换后的主菜单可见状态
     */
    toggleMenu() {
      this._menuVisible = !this._menuVisible;
      this.toolbar?.setVisible(this._menuVisible);
      this.ruler?.setVisible(this._menuVisible);
      // 主菜单恢复显示时，同步标尺开关按钮文案，保证状态一致
      if (this._menuVisible) {
        this.toolbar?.updateToggleLabel?.(this.ruler.visible);
      }
      // 持久化保存状态
      this.settingsModal.setMenuVisible(this._menuVisible);
      return this._menuVisible;
    }

    /**
     * 控制“截图干扰元素”的可见性（标尺/参考线/工具条/选区框），保留进度模态框可见
     * @param {boolean} visible
     */
    _setUiVisible(visible) {
      // 标尺用 setDomVisible 避免影响用户手动开关的标志位
      this.ruler?.setDomVisible(visible);
      this.guides?.setVisible(visible);
      this.selections?.setVisible(visible);
      this.toolbar?.setVisible(visible);
    }

    /**
     * 处理“开始裁切 PNG”
     */
    async _handleStart() {
      try {
        const guides = this.guides.getGuides();
        const selections = this.selections.getSelections();
        
        // 合并计算 cells。这里需要修改 ScreenshotManager.computeCells 以支持 selections
        const cells = this.screenshot.computeCells(guides, selections);
        
        if (cells.length === 0) {
          this._notify(SSS.I18n.t('notifyNoRegion'));
          return;
        }
        // 截图前隐藏插件覆盖层
        this._setUiVisible(false);
        try {
          await this.screenshot.start(guides, location.href, selections);
        } finally {
          // 恢复覆盖层
          this._setUiVisible(true);
        }
      } catch (err) {
        this._notify(err.message || String(err));
      }
    }

    /**
     * 监听来自 Popup 的消息
     */
    _listenMessages() {
      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        switch (message?.type) {
          case SSS.MSG.START_CAPTURE:
            this._handleStart()
              .then(() => sendResponse({ ok: true }))
              .catch((e) => sendResponse({ ok: false, error: e.message }));
            return true;

          case SSS.MSG.CLEAR_GUIDES:
            this.guides.clearAll();
            sendResponse({ ok: true });
            return false;

          case SSS.MSG.TOGGLE_RULER:
            this.ruler.setVisible(!this.ruler.visible);
            this.toolbar.updateToggleLabel?.(this.ruler.visible);
            sendResponse({ ok: true, visible: this.ruler.visible });
            return false;

          case SSS.MSG.TOGGLE_MENU:
            sendResponse({ ok: true, visible: this.toggleMenu() });
            return false;

          case SSS.MSG.GET_STATE:
            sendResponse({
              ok: true,
              guideCount: this.guides.count,
              rulerVisible: this.ruler.visible,
              menuVisible: this._menuVisible,
            });
            return false;

          default:
            return false;
        }
      });
    }

    /**
     * 页面内通知提示（错误或提示信息）
     * @param {string} msg 
     * @param {'error'|'info'} type
     */
    _notify(msg, type = 'error') {
      console.log(`[SSS] [${type}]`, msg);
      const isError = type === 'error';
      const tip = document.createElement('div');
      tip.style.cssText =
        `position:fixed;top:60px;right:16px;z-index:2147484600;` +
        `background:${isError ? '#7f1d1d' : 'rgba(37, 99, 235, 0.9)'};` +
        `color:#fff;padding:12px 16px;border-radius:8px;font-size:13px;` +
        `box-shadow:0 4px 16px rgba(0,0,0,.3);max-width:340px;word-break:break-all;` +
        `font-family:-apple-system,sans-serif;border:1px solid ${isError ? '#ef4444' : '#60a5fa'};` +
        `backdrop-filter: blur(8px); transition: opacity 0.3s ease;`;
      tip.textContent = (isError ? '⚠ ' : 'ℹ ') + msg;
      this.shadow.appendChild(tip);
      setTimeout(() => {
        tip.style.opacity = '0';
        setTimeout(() => tip.remove(), 300);
      }, 4000);
    }
  }

  // 启动应用
  const app = new App();
  window.__sssApp = app; // 便于调试（可选）
})();
