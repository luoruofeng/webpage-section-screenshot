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

      this.background = new SSS.BackgroundService();
      this.storage = new SSS.Storage();

      this.ruler = new SSS.Ruler(this.shadow, SSS.RULER_SIZE);
      this.guides = new SSS.GuideManager(this.shadow, this.storage);
      this.progressModal = new SSS.ProgressModal(this.shadow);
      this.screenshot = new SSS.ScreenshotManager(this.background, this.progressModal);
      this.toolbar = new SSS.Toolbar(this.shadow);

      this._wire();
    }

    /**
     * 创建 Shadow DOM 根节点
     */
    _initShadow() {
      this.hostEl = document.createElement('div');
      this.hostEl.id = 'sss-shadow-host';
      this.hostEl.style.cssText =
        'all:initial;position:fixed;top:0;left:0;z-index:2147483000;';
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
      this.ruler.onDragStart = (data) => this.guides.startDrag(data);
      this.ruler.onDragMove = (x, y) => this.guides.moveDrag(x, y);
      this.ruler.onDragEnd = (x, y) => this.guides.endDrag(x, y);

      // 标尺拖拽的 move/end 需要全局监听
      this._bindRulerDragGlobal();

      // 参考线变化 -> 工具条统计
      this.guides.onChange = (list) => this.toolbar.setGuideCount(list.length);

      // 进度模态框取消 -> 截图管理器取消
      this.progressModal.onCancel = () => this.screenshot.cancel();

      // 工具条按钮
      this.toolbar.onStart = () => this._handleStart();
      this.toolbar.onClear = () => this.guides.clearAll();
      this.toolbar.onToggleRuler = () => {
        this.ruler.setVisible(!this.ruler.visible);
        this.toolbar.updateToggleLabel?.(this.ruler.visible);
      };

      // 截图回调：错误信息已由 ScreenshotManager 在模态框内 showError 展示，
      // 此处仅补充日志，避免与 _handleStart 的 catch 重复弹提示。
      this.screenshot.onError = (err) => {
        console.error('[SSS] 截图失败:', err);
      };

      // Popup 消息监听
      this._listenMessages();

      // 初始化加载持久化的参考线
      this.guides.load().then(() => {
        this.toolbar.setGuideCount(this.guides.count);
      });
    }

    /**
     * 全局监听标尺拖拽的 move / end
     */
    _bindRulerDragGlobal() {
      this._onDragMove = (e) => {
        this.ruler.onDragMove?.(e.clientX, e.clientY);
      };
      this._onDragEnd = (e) => {
        this.ruler.onDragEnd?.(e.clientX, e.clientY);
      };
      window.addEventListener('pointermove', this._onDragMove);
      window.addEventListener('pointerup', this._onDragEnd);
    }

    /**
     * 控制“截图干扰元素”的可见性（标尺/参考线/工具条），保留进度模态框可见
     * @param {boolean} visible
     */
    _setUiVisible(visible) {
      // 标尺用 setDomVisible 避免影响用户手动开关的标志位
      this.ruler?.setDomVisible(visible);
      this.guides?.setVisible(visible);
      this.toolbar?.setVisible(visible);
    }

    /**
     * 处理“开始裁切 PNG”
     */
    async _handleStart() {
      try {
        const guides = this.guides.getGuides();
        const cells = this.screenshot.computeCells(guides);
        if (cells.length === 0) {
          this._notify('请至少设置两条参考线以划分截图区域（需要形成区块）。');
          return;
        }
        // 截图前隐藏插件覆盖层（标尺/参考线/工具条），避免出现在截图画面中
        this._setUiVisible(false);
        try {
          await this.screenshot.start(guides, location.href);
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

          case SSS.MSG.GET_STATE:
            sendResponse({
              ok: true,
              guideCount: this.guides.count,
              rulerVisible: this.ruler.visible,
            });
            return false;

          default:
            return false;
        }
      });
    }

    /**
     * 页面内通知提示（错误或提示信息）
     */
    _notify(msg) {
      console.error('[SSS]', msg);
      const tip = document.createElement('div');
      tip.style.cssText =
        'position:fixed;top:60px;right:16px;z-index:2147484600;background:#7f1d1d;color:#fff;' +
        'padding:12px 16px;border-radius:8px;font-size:13px;box-shadow:0 4px 16px rgba(0,0,0,.3);' +
        'max-width:340px;word-break:break-all;font-family:-apple-system,sans-serif;' +
        'border:1px solid #ef4444;';
      tip.textContent = '⚠ ' + msg;
      this.shadow.appendChild(tip);
      setTimeout(() => tip.remove(), 6000);
    }
  }

  // 启动应用
  const app = new App();
  window.__sssApp = app; // 便于调试（可选）
})();
