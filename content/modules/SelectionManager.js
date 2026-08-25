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
    }

    _buildLayer() {
      const layer = document.createElement('div');
      layer.id = 'sss-selection-layer';
      layer.style.cssText =
        'position:absolute;top:0;left:0;width:0;height:0;' +
        // 必须低于 Shadow DOM 宿主(2147483000)的 z-index，
        // 否则选区框/参考线会盖住 Shadow 内的模态框（进度/关闭/打开文件夹按钮）。
        'pointer-events:none;z-index:2147482500;';
      
      const style = document.createElement('style');
      style.textContent = `
        #sss-selection-layer .sss-selection {
          position: absolute;
          pointer-events: auto;
          border: 2px solid #2563eb;
          background: rgba(37, 99, 235, 0.05);
          box-sizing: border-box;
          user-select: none;
          transition: border-color .15s ease, background-color .15s ease;
        }
        #sss-selection-layer .sss-selection:hover {
          border-color: #1d4ed8;
          background: rgba(37, 99, 235, 0.1);
        }
        #sss-selection-layer .sss-selection-preview {
          position: absolute;
          pointer-events: none;
          border: 1px dashed #2563eb;
          background: rgba(37, 99, 235, 0.1);
          box-sizing: border-box;
        }
        #sss-selection-layer .sss-selection-delete-btn {
          position: absolute;
          right: -9px;
          top: -9px;
          width: 18px;
          height: 18px;
          border: none;
          border-radius: 50%;
          background: #ef4444;
          color: #fff;
          font-size: 12px;
          line-height: 1;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          z-index: 5;
          box-shadow: 0 1px 4px rgba(0,0,0,.3);
          transition: transform .15s ease, background-color .15s ease;
        }
        #sss-selection-layer .sss-selection-delete-btn:hover {
          background: #dc2626;
          transform: scale(1.1);
        }
        #sss-selection-layer .sss-selection-hint {
          position: absolute;
          pointer-events: none;
          background: rgba(0, 0, 0, 0.75);
          color: #fff;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 10;
          transform: translate(12px, 12px);
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          font-family: -apple-system, sans-serif;
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

    _resizeLayer() {
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
      this._restoreSelection();
      this._layer?.remove();
    }
  }

  SSS.SelectionManager = SelectionManager;
})();
