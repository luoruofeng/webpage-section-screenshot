/**
 * ScreenshotManager 模块 — 整页截图与分区裁剪（PNG 输出）
 *
 * 核心方案（滚动拼接整页截图 + 按参考线裁切）：
 * 1. 计算整个文档的完整尺寸（scrollWidth / scrollHeight，包含不可见部分）
 * 2. 将整页按视口大小划分为网格，逐格滚动并调用 captureVisibleTab 截取真实画面
 * 3. 将所有视口片段按文档坐标拼接进一张“整页 canvas”
 * 4. 根据参考线网格计算分区块，从整页 canvas 中裁剪每个完整区块输出 PNG
 * 5. 通过 background 的 chrome.downloads 逐张保存，并驱动进度模态框更新
 *
 * 关键点：
 * - 页面无论多长 / 多宽，可见与不可见部分都会被完整拼接保存
 * - 使用真实渲染截图（captureVisibleTab），保真度高于 html2canvas
 * - 参考线作为切分标准，每个区块 = 参考线网格中的一个格子
 *
 * 高内聚：截图/拼接/分区计算逻辑全部封装于此；
 * 低耦合：依赖 BackgroundService（消息封装）与 ProgressModal（进度 UI），通过构造函数注入。
 */

(function () {
  class ScreenshotManager {
    /**
     * @param {Object} background 后台通信封装
     * @param {Object} progressModal 进度模态框
     */
    constructor(background, progressModal) {
      this.background = background;
      this.progressModal = progressModal;
      this._cancelled = false;
      this._lastCaptureAt = 0; // 上次 captureVisibleTab 调用时间（用于频率控制）
      this.onFinish = null; // 全部完成回调
      this.onError = null; // 出错回调
    }

    /* ==================== 分区计算 ==================== */

    /**
     * 计算文档完整尺寸（含不可见滚动区域）
     * @returns {{width:number, height:number}}
     */
    getDocumentSize() {
      const doc = document.documentElement;
      const body = document.body;
      return {
        width: Math.max(
          doc.scrollWidth,
          body?.scrollWidth || 0,
          doc.clientWidth,
          window.innerWidth
        ),
        height: Math.max(
          doc.scrollHeight,
          body?.scrollHeight || 0,
          doc.clientHeight,
          window.innerHeight
        ),
      };
    }

    /**
     * 根据参考线和选区框计算分区块（cells）
     * @param {Array<{vertical:boolean, pos:number}>} guides 参考线数组
     * @param {Array<{x:number, y:number, w:number, h:number}>} selections 选区框数组
     * @returns {Array<{x:number,y:number,w:number,h:number}>} 区块列表（文档坐标，相对文档左上角）
     */
    computeCells(guides, selections = []) {
      const verticalPos = guides
        .filter((g) => g.vertical)
        .map((g) => g.pos)
        .sort((a, b) => a - b);
      const horizontalPos = guides
        .filter((g) => !g.vertical)
        .map((g) => g.pos)
        .sort((a, b) => a - b);

      const { width: docWidth, height: docHeight } = this.getDocumentSize();

      // 1. 处理参考线网格
      const uniq = (arr) => arr.filter((p, i) => arr.indexOf(p) === i);
      const xBoundaries = uniq([0, ...verticalPos, docWidth]);
      const yBoundaries = uniq([0, ...horizontalPos, docHeight]);

      const cells = [];
      // 只有在至少有一条横向和一条纵向参考线时，才生成网格区块
      // 或者按照原逻辑，如果没有参考线，xBoundaries=[0, docWidth], yBoundaries=[0, docHeight]，会生成一个整页区块
      // 但原逻辑 computeCells(guides) 在 index.js 中如果 cells 为空会报错
      // 这里保持逻辑：如果有参考线，按参考线切分；如果没有参考线，则不生成网格区块（除非 selections 也没有）
      
      const hasGuides = guides.length > 0;
      if (hasGuides) {
        for (let i = 0; i < xBoundaries.length - 1; i++) {
          for (let j = 0; j < yBoundaries.length - 1; j++) {
            const x = xBoundaries[i];
            const y = yBoundaries[j];
            const w = xBoundaries[i + 1] - x;
            const h = yBoundaries[j + 1] - y;
            // 忽略过小区块
            if (w < SSS.MIN_CELL_SIZE || h < SSS.MIN_CELL_SIZE) continue;
            cells.push({ x, y, w, h });
          }
        }
      }

      // 2. 添加选区框区块
      for (const sel of selections) {
        if (sel.w >= SSS.MIN_CELL_SIZE && sel.h >= SSS.MIN_CELL_SIZE) {
          cells.push({ x: sel.x, y: sel.y, w: sel.w, h: sel.h });
        }
      }

      // 3. 统一按网页顺序排序：从上到下，从左到右
      cells.sort((a, b) => {
        if (Math.abs(a.y - b.y) > 1) {
          return a.y - b.y;
        }
        return a.x - b.x;
      });

      return cells;
    }

    /* ==================== 整页拼接截图 ==================== */

    /**
     * 滚动页面并捕获所有区块。
     * 核心改进：不再创建一张巨大的整页 canvas（避免超过浏览器 32k 像素限制导致空白），
     * 而是为每个要保存的区块创建独立的 canvas，在滚动过程中将视口交集部分直接绘制到各区块 canvas 中。
     *
     * @param {Array<{x:number,y:number,w:number,h:number}>} cells 区块列表
     * @param {number} dpr 设备像素比
     * @param {number} scale 导出放大倍率
     * @returns {Promise<Array<HTMLCanvasElement>>} 与 cells 一一对应的 canvas 数组
     */
    async _captureCells(cells, dpr, scale) {
      const { width: docWidth, height: docHeight } = this.getDocumentSize();
      // 使用 clientWidth/Height 替代 innerWidth/Height，以排除滚动条占据的空间
      const vw = document.documentElement.clientWidth;
      const vh = document.documentElement.clientHeight;
      const s = dpr * scale;
      const renderScale = scale; // 相对截图源像素（dpr）的放大倍数

      // 1. 为每个 cell 初始化独立的 canvas
      const cellCanvases = cells.map((cell) => {
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(cell.w * s));
        canvas.height = Math.max(1, Math.round(cell.h * s));
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        // 初始填充透明（PNG 默认），也可根据需要填充背景色
        return canvas;
      });

      // 2. 计算需要滚动的网格（增加重叠以消除接缝黑线）
      const overlap = 20; // 20px 重叠区域
      const stepW = vw - overlap;
      const stepH = vh - overlap;
      
      const cols = Math.max(1, Math.ceil((docWidth - overlap) / stepW));
      const rows = Math.max(1, Math.ceil((docHeight - overlap) / stepH));
      const totalTiles = cols * rows;
      let capturedTiles = 0;

      // 3. 逐格滚动并捕获
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (this._cancelled) return cellCanvases;

          // 计算滚动位置，确保最后一块不会超出文档边界
          const tileX = Math.min(col * stepW, Math.max(0, docWidth - vw));
          const tileY = Math.min(row * stepH, Math.max(0, docHeight - vh));
          this._scrollTo(tileX, tileY);

          // 等待渲染稳定
          await this._waitForPaint();
          await this._wait(250); // 增加等待时间，从 150ms 提高到 250ms，确保复杂页面重绘完成

          const dataUrl = await this._captureVisibleTabThrottled();
          const img = await this._loadImage(dataUrl);

          // 当前实际滚动位置
          const curScrollX = window.scrollX || document.documentElement.scrollLeft;
          const curScrollY = window.scrollY || document.documentElement.scrollTop;

          // 视口在文档中的实际像素范围（以 dpr 计）
          // captureVisibleTab 返回的 img 分辨率通常是 (vw * dpr, vh * dpr)
          const viewW = img.width;
          const viewH = img.height;

          // 4. 将当前视口图像分发到所有相关的 cell canvas 中
          for (let i = 0; i < cells.length; i++) {
            const cell = cells[i];
            const canvas = cellCanvases[i];
            const ctx = canvas.getContext('2d');

            // 计算 cell 与当前视口的交集（文档坐标系，CSS 像素）
            const intersectX = Math.max(cell.x, curScrollX);
            const intersectY = Math.max(cell.y, curScrollY);
            const intersectRight = Math.min(cell.x + cell.w, curScrollX + vw);
            const intersectBottom = Math.min(cell.y + cell.h, curScrollY + vh);

            const intersectW = intersectRight - intersectX;
            const intersectH = intersectBottom - intersectY;

            if (intersectW > 0 && intersectH > 0) {
              // 交集部分在视口截图中对应的源坐标（像素）
              // 使用精确浮点坐标，让浏览器处理子像素渲染，避免 Math.round 导致的接缝
              const sx = (intersectX - curScrollX) * dpr;
              const sy = (intersectY - curScrollY) * dpr;
              const sw = intersectW * dpr;
              const sh = intersectH * dpr;

              // 交集部分在目标 cell canvas 中对应的位置（像素，需乘 s）
              const dx = (intersectX - cell.x) * s;
              const dy = (intersectY - cell.y) * s;
              const dw = intersectW * s;
              const dh = intersectH * s;

              if (sw > 0 && sh > 0 && dw > 0 && dh > 0) {
                ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
              }
            }
          }

          capturedTiles++;
          this.progressModal.update(
            Math.round((capturedTiles / totalTiles) * 100),
            100
          );
          this.progressModal.setStatus(
            SSS.I18n.t('progressCapturing', { done: capturedTiles, total: totalTiles })
          );
        }
      }

      return cellCanvases;
    }

    /* ==================== 启动保存流程 ==================== */

    /**
     * 启动整页截图与分区保存流程
     * @param {Array<{vertical:boolean,pos:number}>} guides 参考线
     * @param {string} url 页面 URL（用于命名）
     * @param {Array<{x:number, y:number, w:number, h:number}>} selections 选区框
     * @returns {Promise<number>} 成功保存数量
     */
    async start(guides, url = location.href, selections = []) {
      const cells = this.computeCells(guides, selections);
      if (cells.length === 0) {
        throw new Error(SSS.I18n.t('progressStartErr'));
      }

      this._cancelled = false;
      this.progressModal.show(cells.length);

      const folder = SSS.Naming.folderName();
      const initScrollX = window.scrollX || document.documentElement.scrollLeft;
      const initScrollY = window.scrollY || document.documentElement.scrollTop;

      // 临时隐藏滚动条，避免截图包含滚动条或因其导致的布局偏移
      const originalOverflow = document.documentElement.style.overflow;
      document.documentElement.style.overflow = 'hidden';

      try {
        const dpr = window.devicePixelRatio || 1;
        const scale = SSS.EXPORT_SCALE;

        // 阶段一：滚动捕获所有区块内容
        this.progressModal.setVisible(false);
        this.progressModal.setStatus(SSS.I18n.t('progressPreparing'));
        const cellCanvases = await this._captureCells(cells, dpr, scale);
        this.progressModal.setVisible(true);

        if (this._cancelled) {
          this.progressModal.setStatus(SSS.I18n.t('progressCancelled'));
          return 0;
        }

        // 阶段二：将生成的各区块 canvas 保存为 PNG
        let saved = 0;
        for (let i = 0; i < cellCanvases.length; i++) {
          if (this._cancelled) break;

          const canvas = cellCanvases[i];
          const index = i + 1;

          this.progressModal.update(i, cells.length);
          this.progressModal.setStatus(
            SSS.I18n.t('progressExporting', { index, total: cells.length })
          );

          const dataUrl = canvas.toDataURL('image/png');
          const filename = SSS.Naming.build(index, url, folder);
          await this.background.downloadPng(dataUrl, filename);

          saved++;
          this.progressModal.update(saved, cells.length);
        }

        if (this._cancelled) {
          this.progressModal.setStatus(SSS.I18n.t('progressCancelledPartial', { count: saved }));
        } else {
          this.progressModal.setStatus(SSS.I18n.t('progressDone', { count: saved }));
          this.progressModal.done(() => {
            this.background.openDownloadsFolder();
          });
        }
        this.onFinish?.(saved);
        return saved;
      } catch (err) {
        this.progressModal.showError(err?.message || String(err));
        this.onError?.(err);
        throw err;
      } finally {
        document.documentElement.style.overflow = originalOverflow;
        this._scrollTo(initScrollX, initScrollY);
      }
    }

    /* ==================== 工具方法 ==================== */

    /**
     * 截取当前视口截图，并做频率控制与失败重试。
     *
     * Chrome 对 chrome.tabs.captureVisibleTab 有严格的速率限制
     * （MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND），整页截图需要逐格调用，
     * 若调用过快会触发配额错误。因此这里：
     * - 每次调用间强制间隔一段时间（节流），避免超过每秒调用上限；
     * - 若仍触发配额错误，则等待更久后重试，而不是直接中断整个流程。
     * @returns {Promise<string>} 视口截图 data URL
     */
    async _captureVisibleTabThrottled() {
      const THROTTLE_MS = 500; // 两次调用之间的最小间隔（毫秒）
      const QUOTA_WAIT_MS = 1200; // 触发配额后额外等待（毫秒）
      const MAX_RETRY = 5;

      // 距上一次调用是否已过足够时间，不足则补齐
      const now = Date.now();
      if (this._lastCaptureAt && now - this._lastCaptureAt < THROTTLE_MS) {
        await this._wait(THROTTLE_MS - (now - this._lastCaptureAt));
      }

      for (let attempt = 0; attempt <= MAX_RETRY; attempt++) {
        try {
          const { dataUrl } = await this.background.captureVisibleTab();
          this._lastCaptureAt = Date.now();
          return dataUrl;
        } catch (e) {
          const msg = e?.message || String(e);
          const isQuota = /QUOTA|MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND/i.test(msg);
          if (isQuota && attempt < MAX_RETRY) {
            // 配额错误：等待更久后重试
            await this._wait(QUOTA_WAIT_MS * (attempt + 1));
            continue;
          }
          throw e;
        }
      }
      throw new Error(SSS.I18n.t('progressCaptureErr'));
    }

    /**
     * 滚动到指定位置（同步，强制使用 instant 行为避免平滑滚动动画）
     */
    _scrollTo(x, y) {
      const html = document.documentElement;
      const prevBehavior = html.style.scrollBehavior || '';
      html.style.scrollBehavior = 'auto';

      try {
        // 直接滚动到目标位置，不再进行无意义的 0,0 重置，减少闪烁与可能的渲染中断
        window.scrollTo({ left: x, top: y, behavior: 'instant' });
      } finally {
        // 恢复页面原始滚动行为
        html.style.scrollBehavior = prevBehavior;
      }
    }

    /**
     * 等待指定毫秒，用于滚动渲染稳定
     */
    _wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * 等待浏览器完成至少一帧绘制（两次 requestAnimationFrame），
     * 确保滚动后的画面已被渲染，避免 captureVisibleTab 截取到旧画面。
     */
    _waitForPaint() {
      return new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      });
    }

    /**
     * 加载图片（dataURL）为 Image 对象
     */
    _loadImage(dataUrl) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(new Error(SSS.I18n.t('progressImageLoadErr')));
        img.src = dataUrl;
      });
    }

    /**
     * 取消当前保存流程
     */
    cancel() {
      this._cancelled = true;
    }
  }

  SSS.ScreenshotManager = ScreenshotManager;
})();
