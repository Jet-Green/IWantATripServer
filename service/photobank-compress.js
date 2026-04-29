const sharp = require('sharp');

const MAX_BYTES = 700 * 1024;

/**
 * Сжимает изображение до ≤ MAX_BYTES (JPEG, mozjpeg).
 * Геометрия: только масштаб «целиком влезает в рамку» (fit: 'inside') — без обрезки кадра.
 * Сначала снижается качество, затем при необходимости уменьшается максимальная сторона.
 */
async function compressPhotobankImage(buffer) {
  if (!buffer || !buffer.length) {
    return buffer;
  }

  const meta = await sharp(buffer).metadata().catch(() => ({}));
  const hasAlpha = meta.hasAlpha === true;
  const iw = meta.width || 1;
  const ih = meta.height || 1;

  /**
   * @param {number | null} maxSide макс. сторона bbox (width/height для fit inside); null — без resize
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
