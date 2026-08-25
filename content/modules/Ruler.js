/**
 * Ruler 模块 — 标尺栏
 *
 * 职责：
 * - 在页面顶部渲染横向标尺（X 轴）与页面最左侧渲染纵向标尺（Y 轴）
 * - 使用 canvas 绘制像素刻度线与数字，适配 devicePixelRatio 高清屏
 * - 基于滚动偏移动态更新刻度显示
 * - 向外部暴露拖拽事件（由 GuideManager 监听，用于创建参考线）
 *
 * 高内聚：标尺的渲染与滚动更新逻辑全部封装在本模块内；
 * 低耦合：通过事件回调对外通信，不直接依赖其他模块。
 */

(function () {
  class Ruler {
    /**
     * @param {Object} host ShadowRoot 宿主
     * @param {number} size 标尺像素厚度（px）
     */
    constructor(host, size = SSS.RULER_SIZE) {
      this.host = host;
      this.size = size;
      this.dpr = window.devicePixelRatio || 1;
      this.visible = true;

      this.hRuler = null; // 横向标尺 canvas
      this.vRuler = null; // 纵向标尺 canvas
      this.corner = null; // 左上角方块
      this.tooltip = null; // 鼠标悬停提示

      // 拖拽创建参考线回调
      this.onDragStart = null;
      this.onDragMove = null;
      this.onDragEnd = null;

      this._build();
      this._bindEvents();
      this._scheduleRender();
    }

    /* ---------- UI 构建 ---------- */

    _build() {
      // 左上角装饰块
      this.corner = document.createElement('div');
      this.corner.className = 'sss-ruler-corner';
      this.corner.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><path d="M3 3h18M3 3v18"/></svg>';

      // 横向标尺
      this.hRuler = document.createElement('canvas');
      this.hRuler.className = 'sss-ruler-horizontal';
      this.hRuler.style.left = this.size + 'px';

      // 纵向标尺
      this.vRuler = document.createElement('canvas');
      this.vRuler.className = 'sss-ruler-vertical';
      this.vRuler.style.top = this.size + 'px';

      // 鼠标悬停提示（跟随鼠标显示在右侧）
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'sss-ruler-tooltip';
      this.tooltip.textContent = SSS.I18n.t('rulerDragHint');
      this.tooltip.style.display = 'none';
      this.host.appendChild(this.tooltip);

      this.host.appendChild(this.corner);
      this.host.appendChild(this.hRuler);
      this.host.appendChild(this.vRuler);

      this._resize();
    }

    /**
     * 根据窗口与滚动区域尺寸设置 canvas 尺寸
     */
    _resize() {
      const vw = window.innerWidth - this.size;
      const vh = window.innerHeight - this.size;

      this.hRuler.width = vw * this.dpr;
      this.hRuler.height = this.size * this.dpr;
      this.hRuler.style.width = vw + 'px';
      this.hRuler.style.height = this.size + 'px';

      this.vRuler.width = this.size * this.dpr;
      this.vRuler.height = vh * this.dpr;
      this.vRuler.style.width = this.size + 'px';
      this.vRuler.style.height = vh + 'px';
    }

    /* ---------- 事件绑定 ---------- */

    _bindEvents() {
      // 从顶部横向标尺（X 轴）拖出横向参考线（水平横线）
      this.hRuler.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        this._dragFromRuler(false, e);
      });

      // 从左侧纵向标尺（Y 轴）拖出纵向参考线（垂直竖线）
      this.vRuler.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        this._dragFromRuler(true, e);
      });

      // 窗口尺寸变化时重绘
      window.addEventListener('resize', () => {
        this._resize();
        this.render();
      });

      // 鼠标悬停在标尺上时，在鼠标右侧显示拖动提示
      [this.hRuler, this.vRuler].forEach((ruler) => {
        ruler.addEventListener('pointerenter', () => this._showTooltip());
        ruler.addEventListener('pointerleave', () => this._hideTooltip());
        ruler.addEventListener('pointermove', (e) => this._moveTooltip(e.clientX, e.clientY));
      });
    }

    /* ---------- 悬停提示 ---------- */

    /**
     * 显示标尺拖动提示
     */
    _showTooltip() {
      if (!this.tooltip) return;
      this.tooltip.style.display = 'block';
    }

    /**
     * 隐藏标尺拖动提示
     */
    _hideTooltip() {
      if (!this.tooltip) return;
      this.tooltip.style.display = 'none';
    }

    /**
     * 移动提示到鼠标右侧
     * @param {number} clientX 鼠标横坐标
     * @param {number} clientY 鼠标纵坐标
     */
    _moveTooltip(clientX, clientY) {
      if (!this.tooltip) return;
      const offset = 12; // 提示与鼠标之间的间距
      this.tooltip.style.left = clientX + offset + 'px';
      this.tooltip.style.top = clientY + offset + 'px';
    }

    /**
     * 处理从标尺拖出的参考线创建手势
     * @param {boolean} vertical 是否创建纵向参考线
     * @param {PointerEvent} e 原始事件
     */
    _dragFromRuler(vertical, e) {
      // 阻止浏览器默认的文本选择行为（标尺位于 Shadow DOM 内，需显式阻止）
      e.preventDefault();
      const doc = document.documentElement;
      const scrollX = window.scrollX || doc.scrollLeft;
      const scrollY = window.scrollY || doc.scrollTop;

      // 记录初始滚动偏移，保证坐标计算正确
      this._baseScrollX = scrollX;
      this._baseScrollY = scrollY;

      this.onDragStart?.({
        vertical,
        startClientX: e.clientX,
        startClientY: e.clientY,
        scrollX,
        scrollY,
      });
    }

    /* ---------- 渲染 ---------- */

    /**
     * 重绘两个标尺（基于当前滚动位置）
     */
    render() {
      if (!this.visible) return;
      const scrollX = window.scrollX || document.documentElement.scrollLeft;
      const scrollY = window.scrollY || document.documentElement.scrollTop;
      this._drawHorizontal(scrollX);
      this._drawVertical(scrollY);
    }

    /**
     * 绘制横向标尺刻度
     * @param {number} scrollX 横向滚动偏移
     */
    _drawHorizontal(scrollX) {
      const ctx = this.hRuler.getContext('2d');
      const w = this.hRuler.width;
      const h = this.hRuler.height;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(this.dpr, this.dpr);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w / this.dpr, h / this.dpr);

      const step = 100;
      const start = Math.floor(scrollX / step) * step;

      ctx.strokeStyle = '#cbd5e1';
      ctx.fillStyle = '#6b7280';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.textBaseline = 'top';

      for (let x = start; x <= scrollX + w / this.dpr; x += step) {
        const posX = x - scrollX;
        // 主刻度（每 5 个主刻度为一个大刻度）
        const isMajor = (x / 100) % 1 === 0;
        const tickH = isMajor ? 12 : 7;
        ctx.beginPath();
        ctx.moveTo(posX + 0.5, h / this.dpr);
        ctx.lineTo(posX + 0.5, h / this.dpr - tickH);
        ctx.stroke();

        if (isMajor) {
          ctx.fillText(String(x), posX + 3, 3);
        }
      }
      ctx.restore();
    }

    /**
     * 绘制纵向标尺刻度
     * @param {number} scrollY 纵向滚动偏移
     */
    _drawVertical(scrollY) {
      const ctx = this.vRuler.getContext('2d');
      const w = this.vRuler.width;
      const h = this.vRuler.height;
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(this.dpr, this.dpr);

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w / this.dpr, h / this.dpr);

      const step = 100;
      const start = Math.floor(scrollY / step) * step;

      ctx.strokeStyle = '#cbd5e1';
      ctx.fillStyle = '#6b7280';
      ctx.font = '9px -apple-system, sans-serif';
      ctx.textBaseline = 'top';

      for (let y = start; y <= scrollY + h / this.dpr; y += step) {
        const posY = y - scrollY;
        const isMajor = (y / 100) % 1 === 0;
        const tickW = isMajor ? 12 : 7;
        ctx.beginPath();
        ctx.moveTo(w / this.dpr, posY + 0.5);
        ctx.lineTo(w / this.dpr - tickW, posY + 0.5);
        ctx.stroke();

        if (isMajor) {
          // 数字旋转 -90° 显示，以标尺宽度中心对齐，避免左侧数字被裁剪
          ctx.save();
          ctx.translate(w / this.dpr / 2, posY + 3);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = 'center';
          ctx.fillText(String(y), 0, 0);
          ctx.restore();
        }
      }
      ctx.restore();
    }

    /* ---------- 生命周期 ---------- */

    /**
     * 合并渲染调用，避免频繁滚动造成过多绘制
     */
    _scheduleRender() {
      let ticking = false;
      this._onScroll = () => {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(() => {
            this.render();
            ticking = false;
          });
        }
      };
      window.addEventListener('scroll', this._onScroll, { passive: true });
      window.addEventListener('resize', this._onScroll, { passive: true });
    }

    /**
     * 用户手动开关标尺（会更新 visible 状态标志）
     * @param {boolean} visible
     */
    setVisible(visible) {
      this.visible = visible;
      this.setDomVisible(visible);
      if (visible) this.render();
    }

    /**
     * 仅控制标尺 DOM 显示（不改变 visible 状态标志），用于截图时临时隐藏
     * @param {boolean} visible
     */
    setDomVisible(visible) {
      const display = visible ? '' : 'none';
      this.hRuler.style.display = display;
      this.vRuler.style.display = display;
      this.corner.style.display = display;
      if (!visible) this._hideTooltip();
    }

    destroy() {
      window.removeEventListener('scroll', this._onScroll);
      this.corner?.remove();
      this.hRuler?.remove();
      this.vRuler?.remove();
      this.tooltip?.remove();
    }
  }

  SSS.Ruler = Ruler;
})();
