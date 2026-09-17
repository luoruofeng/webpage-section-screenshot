/**
 * 全局常量定义
 */

// 全局命名空间（非模块化模式，由多个脚本共享）
globalThis.SSS = globalThis.SSS || {};

// 参考线持久化存储键
SSS.STORAGE_KEY = 'sss_guides';
// 设置持久化存储键
SSS.SETTINGS_KEY = 'sss_settings';

// 标尺厚度（像素）
SSS.RULER_SIZE = 24;

// 忽略的区块最小尺寸（像素）
SSS.MIN_CELL_SIZE = 4;

// 导出放大倍率：整页 canvas 与保存的 PNG 均按 文档尺寸 * dpr * EXPORT_SCALE 渲染。
// 数值越大导出的图片像素越高（更清晰），但文件体积也更大、保存更慢。
// 建议范围 1~3，超长/超大网页可适当调高。
SSS.EXPORT_SCALE = 2;

// 消息类型（Popup / Background / Content 间通信）
SSS.MSG = {
  START_CAPTURE: 'SSS_START_CAPTURE', // Popup -> Content：开始截图
  CLEAR_GUIDES: 'SSS_CLEAR_GUIDES',   // Popup -> Content：清空参考线
  TOGGLE_RULER: 'SSS_TOGGLE_RULER',   // Popup -> Content：切换标尺
  TOGGLE_MENU: 'SSS_TOGGLE_MENU',     // Background -> Content：切换主菜单（工具条+标尺）
  SYNC_MENU: 'SSS_SYNC_MENU',         // Content -> Background：同步主菜单显隐（更新插件图标角标）
  GET_STATE: 'SSS_GET_STATE',         // Popup -> Content：获取状态
  CAPTURE_VISIBLE_TAB: 'CAPTURE_VISIBLE_TAB', // Content -> Background：视口截图
  DOWNLOAD_PNG: 'DOWNLOAD_PNG',       // Content -> Background：下载 PNG
  DOWNLOAD_CHUNK: 'DOWNLOAD_CHUNK',   // Content -> Background：data URL 分段
  DOWNLOAD_ASSEMBLE: 'DOWNLOAD_ASSEMBLE', // Content -> Background：分段组装并下载
  OPEN_DOWNLOADS_FOLDER: 'OPEN_DOWNLOADS_FOLDER', // Content -> Background：打开下载文件夹
};
