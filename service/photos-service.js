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

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const META_TEXT_MAX = 500;
const META_SHORT_MAX = 200;

/**
 * @param {unknown} raw
 * @returns {Record<string, unknown>}
 */
function sanitizePhotobankMetaEntry(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const out = {};

  const trimStr = (v, max) => {
    const s = String(v ?? '').trim();
    if (!s) return '';
    return s.length > max ? s.slice(0, max) : s;
  };

  const placeNameText = trimStr(src.placeNameText, META_TEXT_MAX);
  if (placeNameText) out.placeNameText = placeNameText;

  const enterpriseName = trimStr(src.enterpriseName, META_TEXT_MAX);
  if (enterpriseName) out.enterpriseName = enterpriseName;

  const loc = src.location;
  if (loc && typeof loc === 'object' && loc.type === 'Point' && Array.isArray(loc.coordinates)) {
    const lon = Number(loc.coordinates[0]);
    const lat = Number(loc.coordinates[1]);
    if (Number.isFinite(lon) && Number.isFinite(lat)) {
      out.location = {
        name: trimStr(loc.name, META_TEXT_MAX) || '',
        shortName: trimStr(loc.shortName, META_SHORT_MAX) || '',
        type: 'Point',
        coordinates: [lon, lat],
      };
    }
  }

  return out;
}

/**
 * Публичные поля карточки фотобанка для клиента.
 * @param {{ url?: string; location?: object; placeNameText?: string; enterpriseName?: string; caption?: string }} d
 */
function photobankItemFromDoc(d) {
  const url = d?.url != null ? String(d.url) : '';
  const loc = d?.location;
  const hasLoc =
    loc &&
    typeof loc === 'object' &&
    loc.type === 'Point' &&
    Array.isArray(loc.coordinates) &&
    loc.coordinates.length === 2;
  return {
    url,
    location: hasLoc
      ? {
          name: loc.name != null ? String(loc.name) : '',
          shortName: loc.shortName != null ? String(loc.shortName) : '',
          type: 'Point',
          coordinates: [Number(loc.coordinates[0]), Number(loc.coordinates[1])],
        }
      : null,
    placeNameText: d?.placeNameText != null ? String(d.placeNameText).trim() : '',
    enterpriseName: d?.enterpriseName != null ? String(d.enterpriseName).trim() : '',
    caption: d?.caption != null ? String(d.caption).trim() : '',
  };
}

/**
 * Список фотобанка из MongoDB (коллекция photobankphotos), пагинация по page (с 1).
 * Берём limit+1 строку, чтобы точно знать, есть ли следующая страница.
 * @returns {{ items: ReturnType<typeof photobankItemFromDoc>[], urls: string[], hasMore: boolean }}
 */
async function getPhotosFromDb(page) {
  const limit = pageLimit();
  const p = Math.max(1, parseInt(String(page ?? '1'), 10) || 1);
  const skip = (p - 1) * limit;

  const docs = await PhotobankPhoto.find({})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1)
    .select('url location placeNameText enterpriseName caption')
    .lean();

  const hasMore = docs.length > limit;
  const slice = hasMore ? docs.slice(0, limit) : docs;
  const items = slice.map((d) => photobankItemFromDoc(d));
  const urls = items.map((i) => i.url);

  return { items, urls, hasMore };
}

/**
 * Поиск фотобанка по подстроке в url или objectKey (без учёта регистра).
 * @param {string} rawQuery текст из query-параметра q
 * @param {number|string} page страница с 1
 * @returns {{ items: ReturnType<typeof photobankItemFromDoc>[], urls: string[], hasMore: boolean }}
 */
async function searchPhotosByQuery(rawQuery, page) {
  const q = String(rawQuery ?? '').trim();
  if (!q.length) {
    const err = new Error('Укажите непустой параметр q');
    err.statusCode = 400;
    throw err;
  }
  if (q.length > 200) {
    const err = new Error('Запрос не длиннее 200 символов');
    err.statusCode = 400;
    throw err;
  }

  const limit = pageLimit();
  const p = Math.max(1, parseInt(String(page ?? '1'), 10) || 1);
  const skip = (p - 1) * limit;
  const pattern = new RegExp(escapeRegex(q), 'i');

  const docs = await PhotobankPhoto.find({
    $or: [
      { url: pattern },
      { objectKey: pattern },
      { caption: pattern },
      { placeNameText: pattern },
      { enterpriseName: pattern },
      { 'location.name': pattern },
      { 'location.shortName': pattern },
    ],
  })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1)
    .select('url location placeNameText enterpriseName caption')
    .lean();

  const hasMore = docs.length > limit;
  const slice = hasMore ? docs.slice(0, limit) : docs;
  const items = slice.map((d) => photobankItemFromDoc(d));
  const urls = items.map((i) => i.url);

  return { items, urls, hasMore };
}

/**
 * Загрузка в бакет — по образцу nmp-backend: YaCloud.Upload({ file, path, fileName }), цикл по файлам.
 * После каждой успешной загрузки создаётся документ в коллекции photobankphotos.
 * @param {Express.Multer.File[]} files из multer (.buffer, .originalname, .mimetype)
 * @param {string} userId id пользователя (из JWT) для имени файла
 * @param {unknown[]} [metadataList] по одному объекту на файл (порядок как у files)
 */
async function uploadPhotobankPhotos(files, userId, metadataList) {
  if (!files || files.length === 0) {
    return [];
  }

  if (!userId || !String(userId).trim()) {
    const err = new Error('Не указан пользователь');
    err.statusCode = 401;
    throw err;
  }

  const safeUserId = String(userId).replace(/[^\w-]/g, '');

  const metaArray = Array.isArray(metadataList) ? metadataList : [];

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

    const extra = sanitizePhotobankMetaEntry(metaArray[i]);
    records.push({
      userId,
      objectKey,
      url,
      ...extra,
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

  async searchPhotos(q, page) {
    return searchPhotosByQuery(q, page);
  },

  uploadPhotobankPhotos,
};
