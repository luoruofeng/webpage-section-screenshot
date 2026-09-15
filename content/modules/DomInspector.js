/**
 * DomInspector 模块 — DOM 元素检查器
 *
 * 职责：
 * - 开启后鼠标指针变为醒目的“检查准星”，直观提示当前处于检查状态
 * - 鼠标悬停时高亮鼠标正下方“层级最深”的元素（蓝色半透明覆盖层，可透视元素内容）
 * - 实时显示该元素的增强版 Full XPath（在标准路径基础上附加 id 与 class）
 * - 单击复制该 XPath 并自动退出检查状态，ESC 亦可退出
 *
 * 高内聚：准星光标、高亮层、提示框与 XPath 计算全部封装于此；
 * 低耦合：通过回调向外通知状态变化与复制结果，不直接依赖其它模块。
 *
 * 说明：覆盖层与提示框注入到 documentElement 之下（含 Shadow DOM 的宿主页面），
 * 使用 position: fixed 与视口坐标定位，滚动/缩放时重新计算，始终与页面元素对齐。
 */

(function () {
  // 自定义准星光标（SVG data URL），颜色与高亮层保持一致的蓝色
  const CURSOR_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">' +
    '<circle cx="12" cy="12" r="6.5" fill="none" stroke="#2563eb" stroke-width="2"/>' +
    '<path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5" stroke="#2563eb" stroke-width="2" stroke-linecap="round"/>' +
    '</svg>';

  // 提示框与鼠标之间的偏移量（像素）
  const TIP_OFFSET = 14;

  /**
   * 判断 id / class 名称是否可以安全地拼接进路径（避免路径无法作为选择器使用）
   * @param {string} name
   * @returns {boolean}
   */
  function isSafeIdent(name) {
    return /^[A-Za-z_][\w-]*$/.test(name);
  }

  /**
   * 计算元素在同标签兄弟节点中的位置与总数
   * @param {Element} el
   * @returns {{ pos: number, total: number }}
   */
  function indexAmongSameTag(el) {
    const parent = el.parentElement;
    if (!parent) return { pos: 1, total: 1 };
    let pos = 1;
    let total = 0;
    for (const child of parent.children) {
      if (child.tagName === el.tagName) {
        total++;
        if (child === el) pos = total;
      }
    }
    return { pos, total };
  }

  /**
   * 生成单个元素的路径片段，例如 div[8]、div#abc、div.a.b
   * @param {Element} el
   * @returns {string}
   */
  function segmentOf(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'html') return tag;

    let segment = tag;

    // 同标签兄弟节点多于一个时才附加序号，保证路径唯一且简洁
    const { pos, total } = indexAmongSameTag(el);
    if (total > 1) segment += `[${pos}]`;

    // 附加 id（Chrome 风格）与 class，便于直接识别元素
    const id = el.getAttribute('id');
    if (id && isSafeIdent(id)) segment += `#${id}`;

    const classNames = (el.getAttribute('class') || '')
      .trim()
      .split(/\s+/)
      .filter((name) => name && isSafeIdent(name));
    if (classNames.length) segment += '.' + classNames.join('.');

    return segment;
  }

  /**
   * 计算元素的增强版 Full XPath，形如 /html/body/div[8]/div#abc/div.a
   * 支持穿透 Shadow DOM（以宿主元素继续向上拼接）
   * @param {Element|null} el
   * @returns {string}
   */
  function getFullXPath(el) {
    if (!el || el.nodeType !== 1) return '';
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1) {
      parts.unshift(segmentOf(node));
      const parent = node.parentNode;
      // 命中 Shadow DOM 时，继续从宿主元素向上拼接
      node = parent && parent.host ? parent.host : parent;
    }
    return '/' + parts.join('/');
  }

  class DomInspector {
    constructor() {
      this._active = false;
      this._layer = null;
      this._highlightEl = null;
      this._tooltipEl = null;
      this._xpathEl = null;
      this._tipEl = null;
      this._cursorStyle = null;
      this._lastX = 0;
      this._lastY = 0;
      this._hasCursor = false;
      this._currentXPath = '';

      this.onStateChange = null; // 启用/停用回调（供工具条同步按钮状态）
      this.onCopy = null; // 复制成功回调（供外部提示）

      this._build();
      this._bindEvents();
    }

    /* ------------------------------------------------------------------ */
    /* 初始化                                                              */
    /* ------------------------------------------------------------------ */

    _build() {
      const layer = document.createElement('div');
      layer.id = 'sss-dom-inspector-layer';

      const style = document.createElement('style');
      style.textContent = `
        #sss-dom-inspector-layer {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 0 !important;
          height: 0 !important;
          pointer-events: none !important;
          z-index: 2147482600 !important;
        }
        #sss-dom-inspector-layer .sss-dom-inspector-highlight {
          position: fixed !important;
          pointer-events: none !important;
          background: rgba(37, 99, 235, 0.22) !important;
          border: 1px solid rgba(37, 99, 235, 0.9) !important;
          box-shadow: 0 0 0 1px rgba(147, 197, 253, 0.6) !important;
          box-sizing: border-box !important;
        }
        #sss-dom-inspector-layer .sss-dom-inspector-tooltip {
          position: fixed !important;
          pointer-events: none !important;
          max-width: 60vw !important;
          padding: 6px 10px !important;
          background: rgba(17, 24, 39, 0.92) !important;
          color: #fff !important;
          border: 1px solid rgba(96, 165, 250, 0.6) !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35) !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
            'Microsoft YaHei', sans-serif !important;
          font-size: 12px !important;
          line-height: 1.5 !important;
          word-break: break-all !important;
        }
        #sss-dom-inspector-layer .sss-dom-inspector-xpath {
          color: #93c5fd !important;
        }
        #sss-dom-inspector-layer .sss-dom-inspector-tip {
          display: block !important;
          margin-top: 2px !important;
          font-size: 10px !important;
          color: rgba(255, 255, 255, 0.65) !important;
        }
      `;
      layer.appendChild(style);

      this._highlightEl = document.createElement('div');
      this._highlightEl.className = 'sss-dom-inspector-highlight';
      this._highlightEl.style.display = 'none';
      layer.appendChild(this._highlightEl);

      this._xpathEl = document.createElement('span');
      this._xpathEl.className = 'sss-dom-inspector-xpath';

      this._tipEl = document.createElement('span');
      this._tipEl.className = 'sss-dom-inspector-tip';

      this._tooltipEl = document.createElement('div');
      this._tooltipEl.className = 'sss-dom-inspector-tooltip';
      this._tooltipEl.style.display = 'none';
      this._tooltipEl.appendChild(this._xpathEl);
      this._tooltipEl.appendChild(this._tipEl);
      layer.appendChild(this._tooltipEl);

      document.documentElement.appendChild(layer);
      this._layer = layer;

      this.refreshTexts();
    }

    _bindEvents() {
      this._onMouseMove = (e) => {
        if (!this._active) return;
        this._lastX = e.clientX;
        this._lastY = e.clientY;
        this._hasCursor = true;
        this._inspectAt(e.clientX, e.clientY);
      };

      this._onClick = (e) => {
        if (!this._active || e.button !== 0) return;
        // 点击插件自身的 UI（工具条、模态框等）时不拦截，交由原有交互处理
        const path = e.composedPath?.() || [e.target];
        if (path.some((node) => this._isOwnNode(node))) return;

        // 拦截点击，避免检查时误触发页面自身的交互（如链接跳转、按钮提交）
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const xpath = this._currentXPath;
        this.disable();
        if (xpath) {
          this._copy(xpath);
          this.onCopy?.(xpath);
        }
      };

      this._onKeyDown = (e) => {
        if (!this._active || e.key !== 'Escape') return;
        e.preventDefault();
        e.stopPropagation();
        this.disable();
      };

      // 滚动或缩放时元素位置发生变化，按最后一次鼠标位置重新计算
      this._onViewportChange = () => {
        if (!this._active || !this._hasCursor) return;
        this._inspectAt(this._lastX, this._lastY);
      };

      window.addEventListener('mousemove', this._onMouseMove, true);
      window.addEventListener('click', this._onClick, true);
      window.addEventListener('keydown', this._onKeyDown, true);
      window.addEventListener('scroll', this._onViewportChange, true);
      window.addEventListener('resize', this._onViewportChange, true);
    }

    /* ------------------------------------------------------------------ */
    /* 开关状态                                                            */
    /* ------------------------------------------------------------------ */

    get active() {
      return this._active;
    }

    enable() {
      if (this._active) return;
      this._active = true;
      this._applyCursor();
      this.onStateChange?.(true);
    }

    disable() {
      if (!this._active) return;
      this._active = false;
      this._removeCursor();
      this._hideOverlays();
      this._currentXPath = '';
      this.onStateChange?.(false);
    }

    /**
     * 控制覆盖层显隐（截图等场景下临时隐藏插件 UI）
     * @param {boolean} visible
     */
    setVisible(visible) {
      if (!this._layer) return;
      this._layer.style.display = visible ? '' : 'none';
      if (visible) {
        if (this._active) this._applyCursor();
      } else {
        this._removeCursor();
      }
    }

    /* ------------------------------------------------------------------ */
    /* 检查逻辑                                                            */
    /* ------------------------------------------------------------------ */

    /**
     * 判断节点是否属于插件自身注入的 UI（不参与元素检查）
     * @param {Element} node
     * @returns {boolean}
     */
    _isOwnNode(node) {
      if (!node || node.nodeType !== 1) return false;
      if (typeof node.closest !== 'function') return false;
      if (node.closest('#sss-shadow-host, #sss-dom-inspector-layer, #sss-selection-layer')) {
        return true;
      }
      return (node.id || '').startsWith('sss-');
    }

    /**
     * 取鼠标位置下层级最深、且不属于插件的页面元素
     * @param {number} clientX
     * @param {number} clientY
     * @returns {Element|null}
     */
    _elementAt(clientX, clientY) {
      const stack = document.elementsFromPoint?.(clientX, clientY) || [];
      if (stack.length) {
        const hit = stack.find((node) => !this._isOwnNode(node));
        if (hit) return hit;
      }
      return document.elementFromPoint(clientX, clientY);
    }

    /**
     * 高亮并展示指定视口坐标处的元素信息
     * @param {number} clientX
     * @param {number} clientY
     */
    _inspectAt(clientX, clientY) {
      const el = this._elementAt(clientX, clientY);
      if (!el || el.nodeType !== 1) {
        this._hideOverlays();
        return;
      }

      const rect = el.getBoundingClientRect();
      this._highlightEl.style.display = 'block';
      // 覆盖层紧贴元素尺寸，保证“相同大小”的贴合效果
      this._highlightEl.style.left = `${rect.left}px`;
      this._highlightEl.style.top = `${rect.top}px`;
      this._highlightEl.style.width = `${Math.max(rect.width, 1)}px`;
      this._highlightEl.style.height = `${Math.max(rect.height, 1)}px`;

      const xpath = getFullXPath(el);
      this._currentXPath = xpath;
      this._xpathEl.textContent = xpath;

      this._tooltipEl.style.display = 'block';
      this._positionTooltip(clientX, clientY);
    }

    _positionTooltip(clientX, clientY) {
      const tipRect = this._tooltipEl.getBoundingClientRect();
      let left = clientX + TIP_OFFSET;
      let top = clientY + TIP_OFFSET;

      // 靠近视口右/下边缘时翻转，避免提示框被裁切
      if (left + tipRect.width > window.innerWidth - 4) {
        left = Math.max(4, clientX - TIP_OFFSET - tipRect.width);
      }
      if (top + tipRect.height > window.innerHeight - 4) {
        top = Math.max(4, clientY - TIP_OFFSET - tipRect.height);
      }

      this._tooltipEl.style.left = `${left}px`;
      this._tooltipEl.style.top = `${top}px`;
    }

    _hideOverlays() {
      if (this._highlightEl) this._highlightEl.style.display = 'none';
      if (this._tooltipEl) this._tooltipEl.style.display = 'none';
    }

    /* ------------------------------------------------------------------ */
    /* 光标与剪贴板                                                        */
    /* ------------------------------------------------------------------ */

    /**
     * 注入“检查状态”光标：蓝色准星，表示功能已开启
     */
    _applyCursor() {
      if (this._cursorStyle) return;
      const cursor = `url("data:image/svg+xml,${encodeURIComponent(CURSOR_SVG)}") 12 12, crosshair`;
      const style = document.createElement('style');
      style.id = 'sss-dom-inspector-cursor';
      style.textContent = `html, body, body * { cursor: ${cursor} !important; }`;
      document.documentElement.appendChild(style);
      this._cursorStyle = style;
    }

    _removeCursor() {
      this._cursorStyle?.remove();
      this._cursorStyle = null;
    }

    /**
     * 复制文本到剪贴板，优先使用异步剪贴板 API，失败时回退到 execCommand
     * @param {string} text
     */
    _copy(text) {
      try {
        if (navigator.clipboard?.writeText) {
          navigator.clipboard.writeText(text).catch(() => this._copyFallback(text));
          return;
        }
      } catch (e) {
        // 忽略异常，走兜底方案
      }
      this._copyFallback(text);
    }

    _copyFallback(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
      } catch (e) {
        console.warn('[SSS] XPath 复制失败:', e);
      }
      ta.remove();
    }

    /* ------------------------------------------------------------------ */
    /* 文案与销毁                                                          */
    /* ------------------------------------------------------------------ */

    /**
     * 语言切换后刷新提示文案
     */
    refreshTexts() {
      if (this._tipEl) this._tipEl.textContent = SSS.I18n.t('domInspectorTip');
    }

    destroy() {
      window.removeEventListener('mousemove', this._onMouseMove, true);
      window.removeEventListener('click', this._onClick, true);
      window.removeEventListener('keydown', this._onKeyDown, true);
      window.removeEventListener('scroll', this._onViewportChange, true);
      window.removeEventListener('resize', this._onViewportChange, true);
      this._removeCursor();
      this._layer?.remove();
      this._layer = null;
    }
  }

  SSS.DomInspector = DomInspector;
  // 暴露 XPath 计算能力，便于调试与复用
  SSS.getFullXPath = getFullXPath;
})();
