/**
 * GuideManager 模块 — 参考线管理
 *
 * 职责：
 * - 从标尺拖拽创建纵向/横向参考线（由 Ruler 触发拖拽事件）
 * - 参考线位置可拖动修改
 * - 点击参考线显示删除按钮，可删除
 * - 一键清空所有参考线
 * - 参考线位置持久化到 chrome.storage，刷新后恢复
 * - 维护参考线位置数组，供 ScreenshotManager 计算分区块
 *
 * 高内聚：参考线的创建/交互/存储逻辑全部在此模块内；
 * 低耦合：通过公开方法对外提供数据读取，不依赖其他模块实现。
 */

(function () {
  class GuideManager {
    constructor(host, storage) {
      /** @type {Array<{id:number, vertical:boolean, pos:number, el:HTMLElement}>} */
      this._guides = [];
      this.storage = storage;
      this.onChange = null; // 参考线变化回调
      this._seq = 0;
      this._dragCtx = null;
      this._draggingId = null;
      this._activeId = null; // 当前被点击（显示删除按钮）的参考线
      this._tooltip = null;

      // 创建“文档定位层”：挂在文档根元素下，position:absolute 随页面滚动，
      // 参考线以文档坐标定位，从而“贴在页面某个位置”，滚动时随内容移动。
      this._buildLayer();
      this._bindGlobalEvents();
    }

    /**
     * 构建参考线容器层（在文档流中，随页面滚动）
     * 容器本身 pointer-events:none，仅参考线可交互。
     */
    _buildLayer() {
      const layer = document.createElement('div');
      layer.id = 'sss-guide-layer';
      layer.style.cssText =
        'position:absolute;top:0;left:0;width:0;height:0;' +
        'pointer-events:none;z-index:2147483500;';
      // 注入参考线样式（带前缀，仅作用于本层）
      const style = document.createElement('style');
      style.textContent = `
        #sss-guide-layer{position:absolute;top:0;left:0;width:0;height:0;pointer-events:none;z-index:2147483500;}
        #sss-guide-layer .sss-guide{position:absolute;pointer-events:auto;background:#2563eb;transition:background-color .15s ease;}
        #sss-guide-layer .sss-guide:hover{background:#1d4ed8;}
        #sss-guide-layer .sss-guide-vertical{top:0;bottom:0;width:2px;cursor:ew-resize;}
        #sss-guide-layer .sss-guide-horizontal{left:0;right:0;height:2px;cursor:ns-resize;}
        #sss-guide-layer .sss-guide-active{background:#1d4ed8;box-shadow:0 0 6px rgba(37,99,235,.6);}
        #sss-guide-layer .sss-guide-delete-btn{position:absolute;width:18px;height:18px;border:none;border-radius:50%;background:#ef4444;color:#fff;font-size:12px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;z-index:5;box-shadow:0 1px 4px rgba(0,0,0,.3);transition:transform .15s ease,background-color .15s ease;}
        #sss-guide-layer .sss-guide-delete-btn:hover{background:#dc2626;transform:scale(1.1);}
        #sss-guide-layer .sss-drag-preview{position:absolute;pointer-events:none;background:#2563eb;}
        #sss-guide-layer .sss-drag-preview-vertical{top:0;bottom:0;width:1px;}
        #sss-guide-layer .sss-drag-preview-horizontal{left:0;right:0;height:1px;}
      `;
      layer.appendChild(style);
      // 挂到文档根元素下：absolute 定位相对初始包含块，即文档坐标系，随滚动移动
      document.documentElement.appendChild(layer);
      this._layer = layer;
    }

    /**
     * 更新文档定位层尺寸（覆盖整个文档），确保参考线可延伸到任意位置
     */
    _resizeLayer() {
      const doc = document.documentElement;
      const w = Math.max(doc.scrollWidth, window.innerWidth);
      const h = Math.max(doc.scrollHeight, window.innerHeight);
      this._layer.style.width = w + 'px';
      this._layer.style.height = h + 'px';
    }

    /**
     * 从存储加载参考线
     * @returns {Promise<void>}
     */
    async load() {
      try {
        const data = await this.storage.get(SSS.STORAGE_KEY);
        const list = data?.[SSS.STORAGE_KEY];
        if (Array.isArray(list)) {
          for (const g of list) {
            this._spawnGuide(g.vertical, g.pos, g.id);
          }
        }
      } catch (e) {
        // 存储不可用（如某些受限页面）时静默降级
        console.warn('[SSS] 加载参考线失败:', e);
      }
    }

    /**
     * 获取当前所有参考线数据（深拷贝，供截图使用）
     * @returns {Array<{id:number, vertical:boolean, pos:number}>}
     */
    getGuides() {
      return this._guides.map((g) => ({ id: g.id, vertical: g.vertical, pos: g.pos }));
    }

    get count() {
      return this._guides.length;
    }

    /**
     * 显示 / 隐藏所有参考线 DOM
     * @param {boolean} visible
     */
    setVisible(visible) {
      const display = visible ? '' : 'none';
      for (const g of this._guides) {
        g.el.style.display = display;
      }
    }

    /* ---------- 创建参考线 ---------- */

    /**
     * 由 Ruler 调用，开始拖拽创建
     * @param {Object} data 拖拽初始数据
     */
    startDrag(data) {
      // 预览线使用文档坐标（client 坐标 + 起始滚动偏移）
      const docX = data.startClientX + data.scrollX;
      const docY = data.startClientY + data.scrollY;
      const preview = this._createPreview(data.vertical, docX, docY);
      this._dragCtx = {
        vertical: data.vertical,
        preview,
        fromScrollX: data.scrollX,
        fromScrollY: data.scrollY,
      };
      this._showTooltip(data.vertical, data.startClientX, data.startClientY);
    }

    /**
     * 拖拽移动中更新预览参考线位置（使用文档坐标，预览线放在文档定位层中随滚动）
     * @param {number} clientX
     * @param {number} clientY
     */
    moveDrag(clientX, clientY) {
      if (!this._dragCtx) return;
      const ctx = this._dragCtx;
      // 文档坐标 = 视口坐标 + 当前滚动偏移（无论拖拽开始时的滚动是多少）
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;

      if (ctx.vertical) {
        const pos = clientX + scrollX;
        ctx.preview.style.left = pos + 'px';
        this._updateTooltip(clientX, clientY, `X: ${Math.round(pos)}px`);
      } else {
        const pos = clientY + scrollY;
        ctx.preview.style.top = pos + 'px';
        this._updateTooltip(clientX, clientY, `Y: ${Math.round(pos)}px`);
      }
    }

    /**
     * 拖拽结束，正式创建参考线
     * @param {number} clientX
     * @param {number} clientY
     */
    endDrag(clientX, clientY) {
      if (!this._dragCtx) return;
      const ctx = this._dragCtx;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;

      // 文档坐标 = 视口坐标 + 当前滚动偏移
      const pos = ctx.vertical ? clientX + scrollX : clientY + scrollY;

      this._hideTooltip();
      ctx.preview.remove();
      this._dragCtx = null;

      // 忽略在标尺区域（厚度以内）释放，视为取消。
      // 竖线（vertical=true）来自左侧标尺：回到左侧（clientX<24）取消；
      // 横线（vertical=false）来自顶部标尺：回到顶部（clientY<24）取消。
      const inRulerZone = ctx.vertical ? clientX < 24 : clientY < 24;
      if (inRulerZone) return;

      this._spawnGuide(ctx.vertical, Math.round(pos));
      this._persist();
    }

    /**
     * 内部：创建参考线 DOM 元素
     * 参考线以文档坐标定位（absolute），随页面滚动而移动，如同贴在页面内容上。
     */
    _spawnGuide(vertical, pos, id = ++this._seq) {
      if (id > this._seq) this._seq = id;

      const el = document.createElement('div');
      el.className = `sss-guide ${vertical ? 'sss-guide-vertical' : 'sss-guide-horizontal'}`;

      const guide = { id, vertical, pos, el };
      this._guides.push(guide);

      // 设置文档坐标定位
      if (vertical) {
        el.style.left = pos + 'px';
      } else {
        el.style.top = pos + 'px';
      }
      this._resizeLayer();
      this._bindGuideEvents(guide);

      this._layer.appendChild(el);
      this.onChange?.(this.getGuides());
      return guide;
    }

    /**
     * 参考线已用文档坐标定位，滚动时随文档移动，无需重新计算位置。
     * 此方法仅用于手动刷新（如文档尺寸变化后）。
     */
    _positionGuide(guide) {
      if (guide.vertical) {
        guide.el.style.left = guide.pos + 'px';
      } else {
        guide.el.style.top = guide.pos + 'px';
      }
    }

    /* ---------- 参考线交互 ---------- */

    /**
     * 绑定参考线的拖拽、点击、删除事件
     */
    _bindGuideEvents(guide) {
      // 拖动修改位置
      guide.el.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        this._startMoveGuide(guide, e);
      });

      // 点击选中显示删除按钮（单击且未发生拖动）
      guide.el.addEventListener('pointerup', (e) => {
        if (this._draggingId === guide.id && this._movedDist < 3) {
          this._toggleActive(guide);
        }
      });
    }

    /**
     * 开始拖动修改参考线位置
     */
    _startMoveGuide(guide, e) {
      this._draggingId = guide.id;
      this._movedDist = 0;
      this._moveStartClientX = e.clientX;
      this._moveStartClientY = e.clientY;
      this._moveStartPos = guide.pos;
      this._moveStartScrollX = window.scrollX || document.documentElement.scrollLeft;
      this._moveStartScrollY = window.scrollY || document.documentElement.scrollTop;

      guide.el.classList.add('sss-guide-active');
      this._showTooltip(guide.vertical, e.clientX, e.clientY, `${guide.vertical ? 'X' : 'Y'}: ${guide.pos}px`);

      this._onMoveHandler = (ev) => this._onMoveGuide(guide, ev);
      this._onUpHandler = () => this._endMoveGuide(guide);
      window.addEventListener('pointermove', this._onMoveHandler);
      window.addEventListener('pointerup', this._onUpHandler);
    }

    _onMoveGuide(guide, ev) {
      const dx = ev.clientX - this._moveStartClientX;
      const dy = ev.clientY - this._moveStartClientY;
      this._movedDist = Math.max(Math.abs(dx), Math.abs(dy));

      // 参考线为文档坐标，newPos = 起始文档坐标 + 鼠标位移 + 滚动增量
      if (guide.vertical) {
        const scrollDelta =
          (window.scrollX || document.documentElement.scrollLeft) - this._moveStartScrollX;
        const newPos = Math.max(0, Math.round(this._moveStartPos + dx + scrollDelta));
        guide.pos = newPos;
        guide.el.style.left = newPos + 'px';
        this._updateTooltip(ev.clientX, ev.clientY, `X: ${newPos}px`);
      } else {
        const scrollDelta =
          (window.scrollY || document.documentElement.scrollTop) - this._moveStartScrollY;
        const newPos = Math.max(0, Math.round(this._moveStartPos + dy + scrollDelta));
        guide.pos = newPos;
        guide.el.style.top = newPos + 'px';
        this._updateTooltip(ev.clientX, ev.clientY, `Y: ${newPos}px`);
      }
    }

    _endMoveGuide(guide) {
      window.removeEventListener('pointermove', this._onMoveHandler);
      window.removeEventListener('pointerup', this._onUpHandler);
      guide.el.classList.remove('sss-guide-active');
      this._hideTooltip();
      this._draggingId = null;
      this._persist();
    }

    /* ---------- 选中与删除 ---------- */

    _toggleActive(guide) {
      // 清除其它选中
      if (this._activeId && this._activeId !== guide.id) {
        const active = this._guides.find((g) => g.id === this._activeId);
        if (active) this._clearDeleteBtn(active);
      }
      if (this._activeId === guide.id) {
        // 再次点击取消选中
        this._clearDeleteBtn(guide);
        this._activeId = null;
      } else {
        this._showDeleteBtn(guide);
        this._activeId = guide.id;
      }
    }

    _showDeleteBtn(guide) {
      const btn = document.createElement('button');
      btn.className = 'sss-guide-delete-btn';
      btn.textContent = '×';
      btn.title = '删除此参考线';
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.removeGuide(guide.id);
      });
      btn.addEventListener('pointerdown', (e) => e.stopPropagation());
      guide.el.appendChild(btn);
    }

    _clearDeleteBtn(guide) {
      const btn = guide.el.querySelector('.sss-guide-delete-btn');
      btn?.remove();
    }

    /**
     * 移除指定参考线
     * @param {number} id
     */
    removeGuide(id) {
      const idx = this._guides.findIndex((g) => g.id === id);
      if (idx === -1) return;
      const [guide] = this._guides.splice(idx, 1);
      guide.el.remove();
      if (this._activeId === id) this._activeId = null;
      this._persist();
      this.onChange?.(this.getGuides());
    }

    /**
     * 一键清空所有参考线
     */
    clearAll() {
      for (const g of this._guides) g.el.remove();
      this._guides = [];
      this._activeId = null;
      this._hideTooltip();
      this._persist();
      this.onChange?.(this.getGuides());
    }

    /* ---------- 预览与提示（拖拽辅助） ---------- */

    _createPreview(vertical, x, y) {
      const p = document.createElement('div');
      p.className = `sss-drag-preview ${vertical ? 'sss-drag-preview-vertical' : 'sss-drag-preview-horizontal'}`;
      // 使用文档坐标定位，挂到文档定位层（随页面滚动）
      if (vertical) p.style.left = x + 'px';
      else p.style.top = y + 'px';
      this._layer.appendChild(p);
      return p;
    }

    _showTooltip(vertical, x, y, text = '') {
      this._tooltip = document.createElement('div');
      this._tooltip.style.cssText =
        'position:fixed;z-index:2147484600;background:#111827;color:#fff;' +
        'font-size:11px;padding:3px 8px;border-radius:4px;pointer-events:none;' +
        'white-space:nowrap;font-family:-apple-system,sans-serif;';
      this._tooltip.textContent = text;
      // 竖线（vertical=true）tooltip 显示在右侧；横线（vertical=false）显示在下方
      this._tooltip.style.left = (vertical ? x + 8 : x) + 'px';
      this._tooltip.style.top = (vertical ? y : y + 8) + 'px';
      document.body.appendChild(this._tooltip);
    }

    _updateTooltip(x, y, text) {
      if (!this._tooltip) return;
      this._tooltip.textContent = text;
      this._tooltip.style.left = x + 'px';
      this._tooltip.style.top = y + 'px';
    }

    _hideTooltip() {
      this._tooltip?.remove();
      this._tooltip = null;
    }

    /* ---------- 全局事件（文档尺寸变化时更新定位层） ---------- */

    _bindGlobalEvents() {
      this._onResizeHandler = () => this._resizeLayer();
      window.addEventListener('resize', this._onResizeHandler, { passive: true });
    }

    /* ---------- 持久化 ---------- */

    _persist() {
      const data = { [SSS.STORAGE_KEY]: this.getGuides() };
      try {
        this.storage.set(data);
      } catch (e) {
        console.warn('[SSS] 保存参考线失败:', e);
      }
    }

    /* ---------- 生命周期 ---------- */

    destroy() {
      window.removeEventListener('resize', this._onResizeHandler);
      this._layer?.remove();
      this._layer = null;
    }
  }

  SSS.GuideManager = GuideManager;
})();
