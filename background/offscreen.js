/**
 * Offscreen Document — 处理大体积图片的 Blob 转换
 *
 * 背景：
 * MV3 的 Service Worker 中不可用 `URL.createObjectURL`（会抛
 * "URL.createObjectURL is not a function"），而 `chrome.downloads.download`
 * 直接接收超长的 data URL 又受 2MB 长度限制，超限时下载会失败或保存为错误文件
 * （如被当作文本存成 .txt）。
 *
 * 超大 data URL 通过 `chrome.runtime.sendMessage` 一次性传输会被截断/损坏，
 * 因此由 Content Script 将 data URL 切分为多个 chunk 逐段发送（OFFSCREEN_CHUNK），
 * 本文档负责：
 * - 按文件名累积存储各 chunk；
 * - 收到 OFFSCREEN_ASSEMBLE 后按序拼接出完整 data URL，转为 Blob，
 *   并通过 `URL.createObjectURL` 生成 `blob:` 对象 URL 返回给 Service Worker。
 *
 * 注意：离屏文档没有 `chrome.downloads` 等 API 的访问权限（仅暴露
 * `chrome.runtime` 等有限子集），因此最终下载动作必须由 Service Worker
 * 调用 `chrome.downloads.download` 完成。
 *
 * 协议：
 *   { action: 'OFFSCREEN_CHUNK', filename, chunk, chunkCount, index }
 *     → { ok: true }
 *   { action: 'OFFSCREEN_ASSEMBLE', filename, chunkCount }
 *     → { ok: true, url: <blob URL>, filename }
 */
let objectUrl = null; // 保存当前待下载的 blob URL，供下载完成后回收

// 累积的各文件分段数据：{ [filename]: { chunkCount, chunks: [] } }
const buffer = {};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.action === 'OFFSCREEN_CHUNK') {
    handleChunk(message)
      .then(() => sendResponse({ ok: true }))
      .catch((error) =>
        sendResponse({ ok: false, error: error.message || String(error) })
      );
    return true; // 异步响应
  }

  if (message?.action === 'OFFSCREEN_ASSEMBLE') {
    handleAssemble(message)
      .then((result) => sendResponse(result))
      .catch((error) =>
        sendResponse({ ok: false, error: error.message || String(error) })
      );
    return true; // 异步响应
  }

  return false;
});

/**
 * 累积存储一段 data URL 分片
 * @param {{filename:string, chunk:string, chunkCount:number, index:number}} message
 */
async function handleChunk(message) {
  const { filename, chunk, chunkCount, index } = message;
  
  // 若是第一片，强制重置该文件的缓冲区，防止因上一次失败导致的脏数据干扰
  if (index === 0) {
    buffer[filename] = { chunkCount, chunks: [] };
  }
  
  // 若 buffer 中不存在该文件（可能是 index 0 丢失或被意外清理），则初始化
  if (!buffer[filename]) {
    buffer[filename] = { chunkCount, chunks: [] };
  }
  
  const entry = buffer[filename];
  entry.chunkCount = chunkCount; // 以最新消息为准
  entry.chunks[index] = chunk;
}

/**
 * 按序拼接所有分片，组装为完整 data URL，转为 Blob 并生成 blob URL。
 * 若分片数量不完整则报错，避免下载损坏文件。
 * @param {{filename:string, chunkCount:number}} message
 * @returns {Promise<{ok:boolean, url:string, filename:string}>}
 */
async function handleAssemble(message) {
  const { filename, chunkCount } = message;
  const entry = buffer[filename];

  // 回收上一次的 blob URL，避免内存泄漏
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl);
    objectUrl = null;
  }

  if (!entry) {
    throw new Error(`未找到文件 ${filename} 的分段数据，请重试`);
  }

  const chunks = entry.chunks;
  // 检查分片是否完整（从 0 到 chunkCount-1 每一项都必须存在）
  let missing = [];
  for (let i = 0; i < chunkCount; i++) {
    if (chunks[i] == null) missing.push(i);
  }

  if (missing.length > 0) {
    // 分片不完整，清理残留并报错
    delete buffer[filename];
    throw new Error(`数据分片不完整，缺失索引: ${missing.join(', ')} (总计 ${chunkCount})`);
  }

  // 仅取前 chunkCount 个分片进行拼接，防止缓冲区污染
  const dataUrl = chunks.slice(0, chunkCount).join('');
  
  // 无论解析成功与否，立即清理已使用的分片数据，释放内存
  delete buffer[filename];

  // 解析并转换为 Blob
  try {
    const { mime, base64 } = parseDataUrl(dataUrl);
    // atob 对 base64 字符串格式要求严格，先去除可能的空白符
    const byteString = atob(base64.replace(/\s/g, ''));
    const bytes = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      bytes[i] = byteString.charCodeAt(i);
    }

    const blob = new Blob([bytes], { type: mime });
    objectUrl = URL.createObjectURL(blob);

    return { ok: true, url: objectUrl, filename };
  } catch (err) {
    throw new Error(`解析数据失败: ${err.message}`);
  }
}

/**
 * 解析 data URL，拆出 MIME 类型与 base64 内容
 * @param {string} dataUrl 形如 `data:image/png;base64,xxxx`
 * @returns {{mime:string, base64:string}}
 */
function parseDataUrl(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') {
    throw new Error('Data URL 为空或非字符串');
  }

  // 更加鲁棒的正则匹配：支持 data: 后缀各种参数，且不强制 base64 在末尾
  const match = dataUrl.match(/^data:([^,]+),(.+)$/s);
  if (!match) {
    throw new Error('Data URL 格式错误：未找到有效的数据前缀或内容');
  }

  const meta = match[1];
  const payload = match[2];

  // 解析 MIME 类型（第一个分号前的部分）
  const mime = meta.split(';')[0] || 'image/png';

  // 检查是否包含 base64 标记（不分大小写）
  const isBase64 = meta.split(';').some(p => p.trim().toLowerCase() === 'base64');
  
  if (!isBase64) {
    throw new Error('仅支持 base64 编码的 data URL');
  }

  return { mime, base64: payload };
}
