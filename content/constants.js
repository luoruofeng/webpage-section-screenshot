/**
 * 全局常量定义
 */

// 全局命名空间（非模块化模式，由多个脚本共享）
globalThis.SSS = globalThis.SSS || {};

// 参考线持久化存储键
SSS.STORAGE_KEY = 'sss_guides';

// 标尺厚度（像素）
SSS.RULER_SIZE = 24;

// 忽略的区块最小尺寸（像素）
SSS.MIN_CELL_SIZE = 4;

// 消息类型（Popup / Background / Content 间通信）
SSS.MSG = {
  START_CAPTURE: 'SSS_START_CAPTURE', // Popup -> Content：开始截图
  CLEAR_GUIDES: 'SSS_CLEAR_GUIDES',   // Popup -> Content：清空参考线
  TOGGLE_RULER: 'SSS_TOGGLE_RULER',   // Popup -> Content：切换标尺
  GET_STATE: 'SSS_GET_STATE',         // Popup -> Content：获取状态
  CAPTURE_VISIBLE_TAB: 'CAPTURE_VISIBLE_TAB', // Content -> Background：视口截图
  DOWNLOAD_PNG: 'DOWNLOAD_PNG',       // Content -> Background：下载 PNG
};
