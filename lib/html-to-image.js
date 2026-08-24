/**
 * html-to-image 精简版（SVG foreignObject 方案）
 *
 * 用途：作为整页/超长内容截图的补充方案。
 * 原理：将节点序列化为 XML，嵌入 SVG 的 <foreignObject> 中，再绘制到 canvas 导出 PNG。
 *
 * 注意：
 * - 依赖浏览器 SVG foreignObject 支持（现代浏览器均支持）
 * - 跨域图片可能污染 canvas（需服务端允许 CORS）
 *
 * 仅提供最小可用实现，供整页长截图场景调用。
 */

/**
 * 将节点渲染为 PNG data URL
 * @param {HTMLElement} node 目标节点
 * @param {Object} options { width, height, backgroundColor }
 * @returns {Promise<string>} PNG data URL
 */
export async function toPng(node, options = {}) {
  const { width, height, backgroundColor = '#ffffff' } = options;
  const clone = await cloneNode(node);
  const svg = buildSvg(clone, width, height, backgroundColor);
  const dataUrl = await svgToPng(svg, width, height);
  return dataUrl;
}

/**
 * 深克隆节点并内联关键样式（简化实现：仅内联计算样式）
 */
async function cloneNode(node) {
  const clone = node.cloneNode(true);
  const style = getComputedStyle(node);
  clone.setAttribute('style', inlineNodeStyle(node, style));
  // 递归内联子节点样式（此处简化，仅处理一层，完整实现需遍历整棵子树）
  for (const child of clone.querySelectorAll('*')) {
    try {
      const cs = getComputedStyle(child);
      child.setAttribute('style', inlineNodeStyle(child, cs));
    } catch (e) {
      /* ignore */
    }
  }
  return clone;
}

function inlineNodeStyle(el, cs) {
  const parts = [];
  for (let i = 0; i < cs.length; i++) {
    const prop = cs[i];
    parts.push(`${prop}:${cs.getPropertyValue(prop)}`);
  }
  // 尺寸
  parts.push(`width:${el.offsetWidth}px`);
  parts.push(`height:${el.offsetHeight}px`);
  return parts.join(';');
}

/**
 * 构建包含节点的 SVG 字符串
 */
function buildSvg(node, width, height, backgroundColor) {
  const xml = new XMLSerializer().serializeToString(node);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="background:${backgroundColor};width:${width}px;height:${height}px;">
          ${xml}
        </div>
      </foreignObject>
    </svg>
  `;
  return svg;
}

/**
 * 将 SVG 字符串绘制到 canvas 并导出 PNG
 */
function svgToPng(svgString, width, height) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}
