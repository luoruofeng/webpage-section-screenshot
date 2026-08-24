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
     * 根据参考线计算分区块（cells）
     * @param {Array<{vertical:boolean, pos:number}>} guides 参考线数组
     * @returns {Array<{x:number,y:number,w:number,h:number}>} 区块列表（文档坐标，相对文档左上角）
     */
    computeCells(guides) {
      const verticalPos = guides
        .filter((g) => g.vertical)
        .map((g) => g.pos)
        .sort((a, b) => a - b);
      const horizontalPos = guides
        .filter((g) => !g.vertical)
        .map((g) => g.pos)
        .sort((a, b) => a - b);

      const { width: docWidth, height: docHeight } = this.getDocumentSize();

      // 边界数组：参考线 + 文档边界（去重）
      const uniq = (arr) => arr.filter((p, i) => arr.indexOf(p) === i);
      const xBoundaries = uniq([0, ...verticalPos, docWidth]);
      const yBoundaries = uniq([0, ...horizontalPos, docHeight]);

      const cells = [];
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
      return cells;
    }

    /* ==================== 整页拼接截图 ==================== */

    /**
     * 滚动拼接整个页面，返回一张完整的整页 canvas
     * @param {number} dpr 设备像素比
     * @returns {Promise<HTMLCanvasElement>} 整页 canvas
     */
    async _captureFullPage(dpr) {
      const { width: docWidth, height: docHeight } = this.getDocumentSize();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      // 整页 canvas（按 dpr 缩放）
      const fullCanvas = document.createElement('canvas');
      fullCanvas.width = Math.ceil(docWidth * dpr);
      fullCanvas.height = Math.ceil(docHeight * dpr);
      const fullCtx = fullCanvas.getContext('2d');

      // 横向 / 纵向分块数量
      const cols = Math.ceil(docWidth / vw);
      const rows = Math.ceil(docHeight / vh);
      const totalTiles = cols * rows;
      let capturedTiles = 0;

      // 逐格滚动并截取拼接
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          if (this._cancelled) return fullCanvas;

          const tileX = col * vw;
          const tileY = row * vh;
          this._scrollTo(tileX, tileY);

          // 等待滚动与渲染稳定
          await this._wait(80);

          const { dataUrl } = await this.background.captureVisibleTab();
          const img = await this._loadImage(dataUrl);

          // 当前滚动位置（以实际为准，防止滚动不到边界）
          const curScrollX = window.scrollX || document.documentElement.scrollLeft;
          const curScrollY = window.scrollY || document.documentElement.scrollTop;

          // 格子（tile）应覆盖的文档区域，裁剪到文档边界内
          const tileW = Math.min(vw, docWidth - tileX);
          const tileH = Math.min(vh, docHeight - tileY);
          if (tileW <= 0 || tileH <= 0) continue;

          // 格子左上角在视口截图中的像素坐标（允许为负，表示格子起始在视口外）
          const srcX = (tileX - curScrollX) * dpr;
          const srcY = (tileY - curScrollY) * dpr;
          const sW = tileW * dpr;
          const sH = tileH * dpr;

          // 计算格子与视口的交集，只绘制交集部分，避免越界
          const clipLeft = Math.max(srcX, 0);
          const clipTop = Math.max(srcY, 0);
          const clipRight = Math.min(srcX + sW, img.width);
          const clipBottom = Math.min(srcY + sH, img.height);

          if (clipLeft < clipRight && clipTop < clipBottom) {
            // 交集在整页 canvas 中的目标位置 = 文档坐标 + 相对格子起点的偏移
            const dstX = tileX * dpr + (clipLeft - srcX);
            const dstY = tileY * dpr + (clipTop - srcY);
            const dstW = clipRight - clipLeft;
            const dstH = clipBottom - clipTop;
            fullCtx.drawImage(
              img,
              clipLeft,
              clipTop,
              dstW,
              dstH,
              dstX,
              dstY,
              dstW,
              dstH
            );
          }

          capturedTiles++;
          // 更新拼接进度
          this.progressModal.update(
            Math.round((capturedTiles / totalTiles) * 100),
            100
          );
          this.progressModal.setStatus(
            `正在截取整页 ${capturedTiles}/${totalTiles}...`
          );
        }
      }

      return fullCanvas;
    }

    /* ==================== 启动保存流程 ==================== */

    /**
     * 启动整页截图与分区保存流程
     * @param {Array<{vertical:boolean,pos:number}>} guides 参考线
     * @param {string} url 页面 URL（用于命名）
     * @returns {Promise<number>} 成功保存数量
     */
    async start(guides, url = location.href) {
      const cells = this.computeCells(guides);
      if (cells.length === 0) {
        throw new Error('请先拖拽标尺设置至少一组参考线，以划分截图区域。');
      }

      this._cancelled = false;
      this.progressModal.show(cells.length);

      // 记录初始滚动位置，完成后恢复
      const initScrollX = window.scrollX || document.documentElement.scrollLeft;
      const initScrollY = window.scrollY || document.documentElement.scrollTop;

      try {
        const dpr = window.devicePixelRatio || 1;

        // 阶段一：滚动拼接整页
        this.progressModal.setStatus('正在拼接整页截图...');
        const fullCanvas = await this._captureFullPage(dpr);
        if (this._cancelled) {
          this.progressModal.setStatus('已取消保存。');
          return 0;
        }

        // 阶段二：按参考线裁剪每个区块
        let saved = 0;
        for (let i = 0; i < cells.length; i++) {
          if (this._cancelled) {
            this.progressModal.setStatus('已取消保存。');
            break;
          }
          const cell = cells[i];
          const index = i + 1;

          this.progressModal.update(i, cells.length);
          this.progressModal.setStatus(`正在保存第 ${index}/${cells.length} 张...`);

          const dataUrl = this._cropCell(fullCanvas, cell, dpr);
          const filename = SSS.Naming.build(index, url);
          await this.background.downloadPng(dataUrl, filename);

          saved++;
          this.progressModal.update(saved, cells.length);
        }

        if (this._cancelled) {
          this.progressModal.setStatus(`已取消，成功保存 ${saved} 张。`);
        } else {
          this.progressModal.setStatus(`全部完成，共保存 ${saved} 张 PNG 图片。`);
          this.progressModal.done();
        }
        this.onFinish?.(saved);
        return saved;
      } catch (err) {
        // 出错时在模态框内显示错误信息（不立即关闭，便于用户查看）
        const msg = err?.message || String(err);
        this.progressModal.showError(msg);
        this.onError?.(err);
        throw err;
      } finally {
        // 恢复原始滚动位置
        this._scrollTo(initScrollX, initScrollY);
      }
    }

    /* ==================== 区块裁剪 ==================== */

    /**
     * 从整页 canvas 中裁剪指定区块，返回 PNG data URL
     * @param {HTMLCanvasElement} fullCanvas 整页 canvas
     * @param {{x:number,y:number,w:number,h:number}} cell 区块（文档坐标）
     * @param {number} dpr 设备像素比
     * @returns {string} PNG data URL
     */
    _cropCell(fullCanvas, cell, dpr) {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(cell.w * dpr));
      canvas.height = Math.max(1, Math.round(cell.h * dpr));
      const ctx = canvas.getContext('2d');

      ctx.drawImage(
        fullCanvas,
        cell.x * dpr,
        cell.y * dpr,
        cell.w * dpr,
        cell.h * dpr,
        0,
        0,
        cell.w * dpr,
        cell.h * dpr
      );
      return canvas.toDataURL('image/png');
    }

    /* ==================== 工具方法 ==================== */

    /**
     * 滚动到指定位置（同步，禁用平滑滚动避免坐标漂移）
     */
    _scrollTo(x, y) {
      window.scrollTo(0, 0); // 先归零，防止某些页面累积
      window.scrollTo(x, y);
    }

    /**
     * 等待指定毫秒，用于滚动渲染稳定
     */
    _wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    /**
     * 加载图片（dataURL）为 Image 对象
     */
    _loadImage(dataUrl) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () =>
          reject(new Error('截图加载失败，可能是页面包含跨域资源导致画布被污染。'));
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
