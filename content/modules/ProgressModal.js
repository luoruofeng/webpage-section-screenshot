/**
 * ProgressModal 模块 — 保存进度模态框
 *
 * 职责：
 * - 展示保存进度（当前/总数）
 * - 详细进度条（已保存百分比）
 * - 状态文字提示、取消按钮、完成反馈
 *
 * 高内聚：模态框 UI 与进度状态管理全部封装于此；
 * 低耦合：通过公开方法被 ScreenshotManager 调用。
 */

(function () {
  class ProgressModal {
    constructor(host) {
      this.host = host;
      this.onCancel = null; // 取消回调
      this._el = null;
      this._fill = null;
      this._text = null;
      this._status = null;
      this._total = 0;
    }

    /**
     * 显示模态框并初始化进度
     * @param {number} total 总区块数
     */
    show(total) {
      this._total = total;
      this._build();
    }

    _build() {
      // 移除旧的
      this.hide();

      const i18n = SSS.I18n;
      const overlay = document.createElement('div');
      overlay.className = 'sss-modal-overlay';

      overlay.innerHTML = `
        <div class="sss-modal">
          <div class="sss-modal-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 3h18M3 3v18"/><rect x="7" y="7" width="14" height="14" rx="2"/>
            </svg>
            ${i18n.t('progressTitle')}
          </div>
          <div class="sss-modal-progress-track">
            <div class="sss-modal-progress-fill"></div>
          </div>
          <div class="sss-modal-progress-text">0 / ${this._total}</div>
          <div class="sss-modal-status">${i18n.t('progressPreparing')}</div>
          <div class="sss-modal-actions">
            <button class="sss-btn sss-btn-secondary sss-cancel-btn">${i18n.t('progressCancel')}</button>
          </div>
          <div class="sss-modal-footer">${i18n.t('progressFooter')}</div>
        </div>
      `;

      this._el = overlay;
      this._fill = overlay.querySelector('.sss-modal-progress-fill');
      this._text = overlay.querySelector('.sss-modal-progress-text');
      this._status = overlay.querySelector('.sss-modal-status');

      overlay.querySelector('.sss-cancel-btn').addEventListener('click', () => {
        this.onCancel?.();
      });

      // 阻止点击遮罩关闭
      overlay.addEventListener('pointerdown', (e) => e.stopPropagation());

      this.host.appendChild(overlay);
      this._update(0, this._total);
    }

    /**
     * 更新进度
     * @param {number} done 已完成数量
     * @param {number} total 总数
     */
    update(done, total) {
      if (!this._el) return;
      this._update(done, total);
    }

    _update(done, total) {
      const pct = total > 0 ? Math.min(100, Math.round((done / total) * 100)) : 0;
      if (this._fill) this._fill.style.width = pct + '%';
      if (this._text) this._text.textContent = `${done} / ${total}`;
    }

    /**
     * 设置状态文字
     * @param {string} msg
     */
    setStatus(msg) {
      if (this._status) this._status.textContent = msg;
    }

    /**
     * 标记完成（绿色进度条），并替换取消按钮为“打开文件夹”按钮
     * @param {Function} onOpenFolder 点击打开文件夹的回调
     */
    done(onOpenFolder) {
      if (!this._el) return;
      const modalEl = this._el.querySelector('.sss-modal');
      modalEl.classList.add('sss-modal-done');

      // 替换取消按钮为“打开文件夹”按钮
      const actionsEl = this._el.querySelector('.sss-modal-actions');
      if (actionsEl) {
        actionsEl.innerHTML = `
          <button class="sss-btn sss-btn-primary sss-open-folder-btn">${SSS.I18n.t('progressOpenFolder')}</button>
          <button class="sss-btn sss-btn-secondary sss-close-btn">${SSS.I18n.t('progressClose')}</button>
        `;
        actionsEl
          .querySelector('.sss-open-folder-btn')
          .addEventListener('click', () => {
            onOpenFolder?.();
          });
        actionsEl.querySelector('.sss-close-btn').addEventListener('click', () => {
          this.hide();
        });
      }
    }

    /**
     * 显示错误信息（红色提示），模态框保留便于用户查看
     * @param {string} msg 错误信息
     */
    showError(msg) {
      if (!this._el) return;
      const statusEl = this._el.querySelector('.sss-modal-status');
      if (statusEl) {
        statusEl.textContent = '⚠ ' + msg;
        statusEl.style.color = '#dc2626';
        statusEl.style.fontWeight = '600';
      }
      // 隐藏取消按钮，仅保留关闭能力（点击遮罩关闭）
      const cancelBtn = this._el.querySelector('.sss-cancel-btn');
      if (cancelBtn) cancelBtn.textContent = SSS.I18n.t('progressClose');
    }

    /**
     * 隐藏模态框（销毁 DOM）
     */
    hide() {
      this._el?.remove();
      this._el = null;
    }

    /**
     * 控制模态框 DOM 的显示 / 隐藏（保留内部状态）
     *
     * 用途：在“滚动拼接整页截图”阶段，模态框必须从页面上隐藏，
     * 否则会被 captureVisibleTab 截取进最终 PNG。拼接完成后重新显示。
     * @param {boolean} visible
     */
    setVisible(visible) {
      if (this._el) this._el.style.display = visible ? '' : 'none';
    }
  }

  SSS.ProgressModal = ProgressModal;
})();
