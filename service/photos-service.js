const crypto = require('crypto');
const YaPhotobank = require('./photos-bucket');
const { compressPhotobankImage } = require('./photobank-compress');
const PhotobankPhoto = require('../models/photobank-photo-model');

function pageLimit() {
  const n = parseInt(process.env.PHOTOBANK_PAGE_SIZE, 10);
  if (Number.isFinite(n) && n > 0) {
    return Math.min(100, n);
  }
  return 24;
}

/**
 * Список URL для фотобанка из MongoDB (коллекция photobankphotos), пагинация по page (с 1).
 * Берём limit+1 строку, чтобы точно знать, есть ли следующая страница.
 * @returns {{ urls: string[], hasMore: boolean }}
 */
async function getPhotosFromDb(page) {
  const limit = pageLimit();
  const p = Math.max(1, parseInt(String(page ?? '1'), 10) || 1);
  const skip = (p - 1) * limit;

  const docs = await PhotobankPhoto.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1)
    .select('url')
    .lean();

  const hasMore = docs.length > limit;
  const slice = hasMore ? docs.slice(0, limit) : docs;
  const urls = slice.map((d) => d.url);

  return { urls, hasMore };
}

/**
 * Загрузка в бакет — по образцу nmp-backend: YaCloud.Upload({ file, path, fileName }), цикл по файлам.
 * После каждой успешной загрузки создаётся документ в коллекции photobankphotos.
 * @param {Express.Multer.File[]} files из multer (.buffer, .originalname, .mimetype)
 * @param {string} userId id пользователя (из JWT) для имени файла
 */
async function uploadPhotobankPhotos(files, userId) {
  if (!files || files.length === 0) {
    return [];
  }

  if (!userId || !String(userId).trim()) {
    const err = new Error('Не указан пользователь');
    err.statusCode = 401;
    throw err;
  }

  const safeUserId = String(userId).replace(/[^\w-]/g, '');

  const allowed = /^image\/(jpeg|jpg|png|gif|webp)$/i;
  const bucketName = String(process.env.PHOTOBANK_BUCKET_NAME || '').trim();
  const records = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const type = file.mimetype || '';
    if (!allowed.test(type)) {
      const err = new Error('Допустимы только изображения (jpeg, png, gif, webp)');
      err.statusCode = 400;
      throw err;
    }

    let compressedBuffer;
    try {
      compressedBuffer = await compressPhotobankImage(file.buffer);
    } catch (e) {
      console.error('[photobank] sharp:', e);
      const err = new Error(`Не удалось обработать изображение: ${file.originalname || 'файл'}`);
      err.statusCode = 400;
      throw err;
    }

    const suffix = crypto.randomBytes(4).toString('hex');
    const fileName = `${Date.now()}_${safeUserId}_${i}_${suffix}.jpg`;

    const uploadResult = await YaPhotobank.Upload({
      file: { buffer: compressedBuffer, mimetype: 'image/jpeg' },
      path: 'photobank',
      fileName,
    });

    const objectKey = uploadResult.Key;
    const url =
      uploadResult.Location ||
      (objectKey && bucketName
        ? YaPhotobank.publicUrlForKey(bucketName, objectKey)
        : '');

    if (!objectKey || !url) {
      const err = new Error('Не удалось получить URL загруженного файла');
      err.statusCode = 500;
      throw err;
    }

    records.push({
      userId,
      objectKey,
      url,
    });
  }

  if (records.length) {
    await PhotobankPhoto.insertMany(records, { ordered: true });
  }

  return records.map((r) => r.url);
}

module.exports = {
  async getPhotos(page) {
    return getPhotosFromDb(page);
  },

  uploadPhotobankPhotos,
};
