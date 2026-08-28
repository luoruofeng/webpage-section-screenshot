/**
 * SelectionManager 模块 — 选区框管理
 * 
 * 职责：
 * - 处理鼠标拖拽创建选区框
 * - 管理多个选区框的数据和 DOM
 * - 提供选区框的样式（与参考线一致）
 * - 清空所有选区框
 */

(function () {
  class SelectionManager {
    constructor(host) {
      this.host = host;
      this._selections = [];
      this._seq = 0;
      this._active = false;
      this._layer = null;
      this._drawingCtx = null;
      this._hintEl = null;
      
      this._buildLayer();
      this._bindEvents();
    }

    _buildLayer() {
      const layer = document.createElement('div');
      layer.id = 'sss-selection-layer';
      
      const style = document.createElement('style');
      style.textContent = `
        #sss-selection-layer {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 0;
          height: 0;
          pointer-events: none !important;
          z-index: 2147482500 !important;
        }
        #sss-selection-layer .sss-selection {
          position: absolute !important;
          pointer-events: auto !important;
          border: 2px solid #2563eb !important;
          background: rgba(37, 99, 235, 0.05) !important;
          box-sizing: border-box !important;
          user-select: none !important;
          -webkit-user-select: none !important;
          transition: border-color .15s ease, background-color .15s ease !important;
        }
        #sss-selection-layer .sss-selection:hover {
          border-color: #1d4ed8 !important;
          background: rgba(37, 99, 235, 0.1) !important;
        }
        #sss-selection-layer .sss-selection-preview {
          position: absolute !important;
          pointer-events: none !important;
          border: 2px solid #2563eb !important;
          background: rgba(37, 99, 235, 0.1) !important;
          box-sizing: border-box !important;
          opacity: 0.7 !important;
        }
        #sss-selection-layer .sss-selection-delete-btn {
          position: absolute !important;
          right: -9px !important;
          top: -9px !important;
          width: 18px !important;
          height: 18px !important;
          border: none !important;
          border-radius: 50% !important;
          background: #ef4444 !important;
          color: #fff !important;
          font-size: 12px !important;
          line-height: 1 !important;
          cursor: pointer !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0 !important;
          z-index: 5 !important;
          box-shadow: 0 1px 4px rgba(0,0,0,.3) !important;
          transition: transform .15s ease, background-color .15s ease !important;
        }
        #sss-selection-layer .sss-selection-delete-btn:hover {
          background: #dc2626 !important;
          transform: scale(1.1) !important;
        }
        #sss-selection-layer .sss-selection-hint {
          position: absolute !important;
          pointer-events: none !important;
          background: rgba(0, 0, 0, 0.75) !important;
          color: #fff !important;
          padding: 4px 8px !important;
          border-radius: 4px !important;
          font-size: 12px !important;
          white-space: nowrap !important;
          z-index: 10 !important;
          transform: translate(12px, 12px) !important;
          backdrop-filter: blur(4px) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
          font-family: -apple-system, sans-serif !important;
        }
      `;
      layer.appendChild(style);
      document.documentElement.appendChild(layer);
      this._layer = layer;

      // 创建提示文字元素
      this._hintEl = document.createElement('div');
      this._hintEl.className = 'sss-selection-hint';
      this._hintEl.textContent = SSS.I18n.t('selectionHint');
      this._hintEl.style.display = 'none';
      this._layer.appendChild(this._hintEl);
    }

    _bindEvents() {
      this._onResizeHandler = () => this._resizeLayer();
      window.addEventListener('resize', this._onResizeHandler, { passive: true });
    }

    _resizeLayer() {
      if (!this._layer) return;
      const doc = document.documentElement;
      const w = Math.max(doc.scrollWidth, window.innerWidth);
      const h = Math.max(doc.scrollHeight, window.innerHeight);
      this._layer.style.width = w + 'px';
      this._layer.style.height = h + 'px';
    }

    setActive(active) {
      this._active = active;
      if (active) {
        this._blockSelection();
        this._hintEl.style.display = '';
        this._resizeLayer();
      } else {
        this._restoreSelection();
        this._hintEl.style.display = 'none';
      }
    }

    get active() {
      return this._active;
    }

    /**
     * 更新鼠标提示位置
     */
    updateCursor(clientX, clientY, scrollX, scrollY) {
      if (!this._active || !this._hintEl) return;
      this._hintEl.style.left = (clientX + scrollX) + 'px';
      this._hintEl.style.top = (clientY + scrollY) + 'px';
    }

    startDrag(clientX, clientY, scrollX, scrollY) {
      if (!this._active) return;
      this._resizeLayer();
      const startX = clientX + scrollX;
      const startY = clientY + scrollY;
      
      const preview = document.createElement('div');
      preview.className = 'sss-selection-preview';
      preview.style.left = startX + 'px';
      preview.style.top = startY + 'px';
      this._layer.appendChild(preview);
      
      this._drawingCtx = {
        startX,
        startY,
        preview
      };
    }

    moveDrag(clientX, clientY, scrollX, scrollY) {
      if (!this._drawingCtx) return;
      const ctx = this._drawingCtx;
      const curX = clientX + scrollX;
      const curY = clientY + scrollY;
      
      const left = Math.min(ctx.startX, curX);
      const top = Math.min(ctx.startY, curY);
      const width = Math.abs(ctx.startX - curX);
      const height = Math.abs(ctx.startY - curY);
      
      ctx.preview.style.left = left + 'px';
      ctx.preview.style.top = top + 'px';
      ctx.preview.style.width = width + 'px';
      ctx.preview.style.height = height + 'px';
    }

    endDrag(clientX, clientY, scrollX, scrollY) {
      if (!this._drawingCtx) return;
      const ctx = this._drawingCtx;
      const curX = clientX + scrollX;
      const curY = clientY + scrollY;
      
      const x = Math.min(ctx.startX, curX);
      const y = Math.min(ctx.startY, curY);
      const w = Math.abs(ctx.startX - curX);
      const h = Math.abs(ctx.startY - curY);
      
      ctx.preview.remove();
      this._drawingCtx = null;
      
      if (w > 5 && h > 5) {
        this._addSelection(x, y, w, h);
      }
    }

    _addSelection(x, y, w, h) {
      const id = ++this._seq;
      const el = document.createElement('div');
      el.className = 'sss-selection';
      el.style.left = x + 'px';
      el.style.top = y + 'px';
      el.style.width = w + 'px';
      el.style.height = h + 'px';
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'sss-selection-delete-btn';
      deleteBtn.textContent = '×';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeSelection(id);
      });
      el.appendChild(deleteBtn);
      
      this._layer.appendChild(el);
      this._selections.push({ id, x, y, w, h, el });
    }

    removeSelection(id) {
      const index = this._selections.findIndex(s => s.id === id);
      if (index !== -1) {
        this._selections[index].el.remove();
        this._selections.splice(index, 1);
      }
    }

    clearAll() {
      this._selections.forEach(s => s.el.remove());
      this._selections = [];
      this._seq = 0;
    }

    getSelections() {
      return this._selections.map(s => ({ x: s.x, y: s.y, w: s.w, h: s.h }));
    }

    /**
     * 语言切换后刷新提示文案
     */
    refreshTexts() {
      if (this._hintEl) this._hintEl.textContent = SSS.I18n.t('selectionHint');
    }

    /**
     * 根据选择器自动添加选区
     * @param {string} className 
     */
    addSelectionByClass(className) {
      // 兼容用户输入带点或不带点的情况
      const selector = className.startsWith('.') ? className : `.${className}`;
      const elements = document.querySelectorAll(selector);
      
      let count = 0;
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        // 仅对可见且有尺寸的元素添加选区
        if (rect.width > 5 && rect.height > 5) {
          const scrollX = window.scrollX || document.documentElement.scrollLeft;
          const scrollY = window.scrollY || document.documentElement.scrollTop;
          
          this._addSelection(
            rect.left + scrollX,
            rect.top + scrollY,
            rect.width,
            rect.height
          );
          count++;
        }
      });
      return count;
    }

    setVisible(visible) {
      this._layer.style.display = visible ? '' : 'none';
    }

    _blockSelection() {
      if (this._blockStyle) return;
      const style = document.createElement('style');
      style.id = 'sss-selection-block-selection';
      style.textContent =
        'body, body * { user-select:none !important; -webkit-user-select:none !important; -webkit-user-drag:none !important; }';
      document.head.appendChild(style);
      this._blockStyle = style;
    }

    _restoreSelection() {
      this._blockStyle?.remove();
      this._blockStyle = null;
    }

    destroy() {
      window.removeEventListener('resize', this._onResizeHandler);
      this._restoreSelection();
      this._layer?.remove();
    }
  }

  SSS.SelectionManager = SelectionManager;
})();
