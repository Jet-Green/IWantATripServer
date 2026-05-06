const MAX_BYTES = 700 * 1024;

let sharpModule = null;
let sharpResolved = false;

function getSharp() {
  if (sharpResolved) {
    return sharpModule === false ? null : sharpModule;
  }
  sharpResolved = true;
  try {
    sharpModule = require('sharp');
    return sharpModule;
  } catch (e) {
    sharpModule = false;
    console.warn(
      '[photobank] модуль sharp не загрузился (часто Node из snap или старый glibc). Сжатие отключено, загружаются исходные байты.',
      e.message
    );
    return null;
  }
}

/**
 * Сжимает изображение до ≤ MAX_BYTES (JPEG), если доступен sharp.
 * Иначе возвращает исходный buffer без изменений.
 */
async function compressPhotobankImage(buffer) {
  if (!buffer || !buffer.length) {
    return buffer;
  }

  const sharp = getSharp();
  if (!sharp) {
    return buffer;
  }

  const meta = await sharp(buffer).metadata().catch(() => ({}));
  const hasAlpha = meta.hasAlpha === true;
  const iw = meta.width || 1;
  const ih = meta.height || 1;

  /**
   * @param {number | null} maxSide
   */
  async function toJpeg(maxSide, q) {
    let chain = sharp(buffer, {
      failOnError: false,
      limitInputPixels: 268_402_689,
    }).rotate();

    if (maxSide != null && maxSide > 0) {
      chain = chain.resize({
        width: maxSide,
        height: maxSide,
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    if (hasAlpha) {
      chain = chain.flatten({ background: { r: 255, g: 255, b: 255 } });
    }

    return chain.jpeg({ quality: q, mozjpeg: true }).toBuffer();
  }

  let quality = 88;
  let out = await toJpeg(null, quality);

  while (out.length > MAX_BYTES && quality > 10) {
    quality -= 5;
    out = await toJpeg(null, quality);
  }

  let maxSide = Math.max(iw, ih);
  let guard = 0;
  while (out.length > MAX_BYTES && guard < 45 && maxSide > 480) {
    guard += 1;
    maxSide = Math.round(maxSide * 0.88);
    out = await toJpeg(maxSide, Math.max(quality, 48));
  }

  if (out.length > MAX_BYTES && maxSide > 360) {
    maxSide = Math.min(maxSide, 360);
    out = await toJpeg(maxSide, Math.max(42, quality));
  }

  return out;
}

module.exports = { compressPhotobankImage, MAX_BYTES };
