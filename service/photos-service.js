const crypto = require('crypto');
const YaPhotobank = require('./photos-bucket');
const { compressPhotobankImage } = require('./photobank-compress');
const PhotobankPhoto = require('../models/photobank-photo-model');
const PlaceModel = require('../models/place-model');

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

function trimMetaStr(v, max) {
  const s = String(v ?? '').trim();
  if (!s) return '';
  return s.length > max ? s.slice(0, max) : s;
}

/**
 * Поля метаданных для обновления своего фото (в т.ч. очистка полей).
 * @param {unknown} raw
 */
function buildPhotobankMetaUpdate(raw) {
  const meta = sanitizePhotobankMetaEntry(raw);
  const $set = {
    placeNameText: trimMetaStr(raw?.placeNameText, META_TEXT_MAX),
    enterpriseName: trimMetaStr(raw?.enterpriseName, META_TEXT_MAX),
  };
  const $unset = {};
  if (meta.location) {
    $set.location = meta.location;
  } else {
    $set.location = { name: '', shortName: '', type: 'Point' };
    $unset['location.coordinates'] = '';
  }
  return { $set, $unset };
}

/**
 * Публичные поля карточки фотобанка для клиента.
 * @param {{ url?: string; location?: object; placeNameText?: string; enterpriseName?: string; caption?: string }} d
 */
/** Фото, доступные в публичном фотобанке (опубликованные и старые записи без поля status). */
const PUBLIC_PHOTOBANK_FILTER = {
  $or: [
    { status: 'published' },
    { status: { $exists: false } },
    { status: null },
    { status: '' },
  ],
};

/**
 * Оставляет только URL опубликованных (публичных) фото фотобанка.
 * @param {string[]} urls
 * @returns {Promise<string[]>}
 */
async function filterPublishedPhotobankUrls(urls) {
  const uniq = [
    ...new Set(
      (urls || [])
        .filter((u) => typeof u === 'string')
        .map((u) => u.trim())
        .filter(Boolean)
    ),
  ];
  if (!uniq.length) return [];

  const docs = await PhotobankPhoto.find({
    $and: [PUBLIC_PHOTOBANK_FILTER, { url: { $in: uniq } }],
  })
    .select('url')
    .lean();

  const allowed = new Set(docs.map((d) => String(d.url)));
  return uniq.filter((u) => allowed.has(u));
}

function normalizeUrlList(urls) {
  return [
    ...new Set(
      (urls || [])
        .filter((u) => typeof u === 'string')
        .map((u) => u.trim())
        .filter(Boolean)
    ),
  ];
}

/** URL из списка, которые есть в коллекции фотобанка. */
async function filterPhotobankUrlsFromList(urls) {
  const uniq = normalizeUrlList(urls);
  if (!uniq.length) return [];
  const docs = await PhotobankPhoto.find({ url: { $in: uniq } }).select('url').lean();
  return docs.map((d) => String(d.url));
}

async function incrementPhotobankUsage(urls) {
  const photobankUrls = await filterPhotobankUrlsFromList(urls);
  if (!photobankUrls.length) return;
  await PhotobankPhoto.updateMany({ url: { $in: photobankUrls } }, { $inc: { usageCount: 1 } });
}

async function decrementPhotobankUsage(urls) {
  const photobankUrls = await filterPhotobankUrlsFromList(urls);
  if (!photobankUrls.length) return;
  const docs = await PhotobankPhoto.find({ url: { $in: photobankUrls } })
    .select('url usageCount')
    .lean();
  for (const d of docs) {
    const next = Math.max(0, (Number(d.usageCount) || 0) - 1);
    await PhotobankPhoto.updateOne({ _id: d._id }, { $set: { usageCount: next } });
  }
}

/**
 * @param {string[]} oldImageUrls
 * @param {string[]} newImageUrls
 */
async function syncPhotobankUsageDiff(oldImageUrls, newImageUrls) {
  const oldPb = new Set(await filterPhotobankUrlsFromList(oldImageUrls));
  const newPb = new Set(await filterPhotobankUrlsFromList(newImageUrls));
  const added = [...newPb].filter((u) => !oldPb.has(u));
  const removed = [...oldPb].filter((u) => !newPb.has(u));
  if (added.length) await incrementPhotobankUsage(added);
  if (removed.length) await decrementPhotobankUsage(removed);
}

/**
 * @param {string} url
 * @returns {Promise<number>}
 */
async function recountPhotobankUsageForUrl(url) {
  const u = String(url ?? '').trim();
  if (!u) return 0;
  const count = await PlaceModel.countDocuments({ images: u });
  await PhotobankPhoto.updateOne({ url: u }, { $set: { usageCount: count } });
  return count;
}

/**
 * @param {Array<{ url: string } & Record<string, unknown>>} items
 */
async function attachUsageCountsToItems(items) {
  if (!items?.length) return items;
  const urls = items.map((i) => i.url).filter(Boolean);
  const rows = await PlaceModel.aggregate([
    { $match: { images: { $in: urls } } },
    { $project: { images: 1 } },
    { $unwind: '$images' },
    { $match: { images: { $in: urls } } },
    { $group: { _id: '$images', count: { $sum: 1 } } },
  ]);
  const map = Object.fromEntries(rows.map((r) => [String(r._id), r.count]));
  return items.map((item) => {
    const usageCount = map[item.url] || 0;
    return {
      ...item,
      usageCount,
      isInUse: usageCount > 0,
    };
  });
}

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

  const docs = await PhotobankPhoto.find(PUBLIC_PHOTOBANK_FILTER)
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
    $and: [
      PUBLIC_PHOTOBANK_FILTER,
      {
        $or: [
          { url: pattern },
          { objectKey: pattern },
          { caption: pattern },
          { placeNameText: pattern },
          { enterpriseName: pattern },
          { 'location.name': pattern },
          { 'location.shortName': pattern },
        ],
      },
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
      status: 'onModeration',
      ...extra,
    });
  }

  if (records.length) {
    await PhotobankPhoto.insertMany(records, { ordered: true });
  }

  return records.map((r) => r.url);
}

function moderationItemFromDoc(d) {
  const base = photobankItemFromDoc(d);
  return {
    ...base,
    _id: d._id != null ? String(d._id) : '',
    status: d?.status != null ? String(d.status) : 'onModeration',
    moderationMessage: d?.moderationMessage != null ? String(d.moderationMessage).trim() : '',
    createdAt: d?.createdAt,
    userId: d?.userId,
    author: d?.userId && typeof d.userId === 'object'
      ? {
          _id: d.userId._id,
          fullinfo: d.userId.fullinfo,
        }
      : null,
    usageCount: Math.max(0, Number(d?.usageCount) || 0),
    isInUse: Math.max(0, Number(d?.usageCount) || 0) > 0,
  };
}

async function findPhotosOnModeration() {
  const docs = await PhotobankPhoto.find({ status: 'onModeration' })
    .sort({ createdAt: -1 })
    .populate('userId', 'fullinfo')
    .lean();
  return docs.map((d) => moderationItemFromDoc(d));
}

async function findRejectedPhotos() {
  const docs = await PhotobankPhoto.find({ status: 'rejected' })
    .sort({ createdAt: -1 })
    .populate('userId', 'fullinfo')
    .lean();
  return docs.map((d) => moderationItemFromDoc(d));
}

async function getPhotoById(_id) {
  const doc = await PhotobankPhoto.findById(_id).populate('userId', 'fullinfo').lean();
  if (!doc) {
    const err = new Error('Фото не найдено');
    err.statusCode = 404;
    throw err;
  }
  return moderationItemFromDoc(doc);
}

async function moderatePhoto(_id) {
  const doc = await PhotobankPhoto.findByIdAndUpdate(
    _id,
    { status: 'published', moderationMessage: '' },
    { new: true }
  ).lean();
  if (!doc) {
    const err = new Error('Фото не найдено');
    err.statusCode = 404;
    throw err;
  }
  return moderationItemFromDoc(doc);
}

async function rejectPhoto(_id, msg) {
  const message = String(msg ?? '').trim().slice(0, 2000);
  const doc = await PhotobankPhoto.findByIdAndUpdate(
    _id,
    { status: 'rejected', moderationMessage: message },
    { new: true }
  ).lean();
  if (!doc) {
    const err = new Error('Фото не найдено');
    err.statusCode = 404;
    throw err;
  }
  return moderationItemFromDoc(doc);
}

async function deletePhoto(_id) {
  const doc = await PhotobankPhoto.findByIdAndDelete(_id);
  if (!doc) {
    const err = new Error('Фото не найдено');
    err.statusCode = 404;
    throw err;
  }
  return { ok: true };
}

function buildMyPhotosQuery(userId, status) {
  const base = { userId };
  if (status === 'onModeration') {
    return { ...base, status: 'onModeration' };
  }
  if (status === 'rejected') {
    return { ...base, status: 'rejected' };
  }
  return {
    ...base,
    $or: [
      { status: 'published' },
      { status: { $exists: false } },
      { status: null },
      { status: '' },
    ],
  };
}

/**
 * Фото текущего пользователя с пагинацией.
 * @param {string} userId
 * @param {'onModeration'|'published'|'rejected'} status
 * @param {number|string} page
 */
async function getMyPhotos(userId, status, page) {
  if (!userId || !String(userId).trim()) {
    const err = new Error('Не указан пользователь');
    err.statusCode = 401;
    throw err;
  }
  const allowed = ['onModeration', 'published', 'rejected'];
  const st = allowed.includes(status) ? status : 'onModeration';

  const limit = pageLimit();
  const p = Math.max(1, parseInt(String(page ?? '1'), 10) || 1);
  const skip = (p - 1) * limit;

  const docs = await PhotobankPhoto.find(buildMyPhotosQuery(userId, st))
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit + 1)
    .lean();

  const hasMore = docs.length > limit;
  const slice = hasMore ? docs.slice(0, limit) : docs;
  let items = slice.map((d) => moderationItemFromDoc(d));
  items = await attachUsageCountsToItems(items);

  return { items, hasMore };
}

async function deleteMyPhoto(userId, _id) {
  if (!userId || !String(userId).trim()) {
    const err = new Error('Не указан пользователь');
    err.statusCode = 401;
    throw err;
  }
  const doc = await PhotobankPhoto.findOne({ _id, userId }).lean();
  if (!doc) {
    const err = new Error('Фото не найдено');
    err.statusCode = 404;
    throw err;
  }
  const usage = await recountPhotobankUsageForUrl(doc.url);
  if (usage > 0) {
    const err = new Error(
      'Нельзя удалить фото: оно используется в карточках мест на сайте'
    );
    err.statusCode = 400;
    throw err;
  }
  await PhotobankPhoto.findOneAndDelete({ _id, userId });
  return { ok: true };
}

async function updateMyPhoto(userId, _id, rawMeta) {
  if (!userId || !String(userId).trim()) {
    const err = new Error('Не указан пользователь');
    err.statusCode = 401;
    throw err;
  }
  const doc = await PhotobankPhoto.findOne({ _id, userId }).lean();
  if (!doc) {
    const err = new Error('Фото не найдено');
    err.statusCode = 404;
    throw err;
  }
  const usage = await recountPhotobankUsageForUrl(doc.url);
  if (usage > 0) {
    const err = new Error(
      'Нельзя редактировать фото: оно используется в карточках мест на сайте'
    );
    err.statusCode = 400;
    throw err;
  }
  const { $set, $unset } = buildPhotobankMetaUpdate(rawMeta);
  if (doc.status === 'published' || doc.status === 'rejected') {
    $set.status = 'onModeration';
    $set.moderationMessage = '';
  }
  const updateOp = { $set };
  if (Object.keys($unset).length) {
    updateOp.$unset = $unset;
  }
  const updated = await PhotobankPhoto.findOneAndUpdate(
    { _id, userId },
    updateOp,
    { new: true }
  ).lean();
  if (!updated) {
    const err = new Error('Фото не найдено');
    err.statusCode = 404;
    throw err;
  }
  let item = moderationItemFromDoc(updated);
  [item] = await attachUsageCountsToItems([item]);
  return item;
}

module.exports = {
  async getPhotos(page) {
    return getPhotosFromDb(page);
  },

  async searchPhotos(q, page) {
    return searchPhotosByQuery(q, page);
  },

  uploadPhotobankPhotos,

  findPhotosOnModeration,
  findRejectedPhotos,
  getPhotoById,
  moderatePhoto,
  rejectPhoto,
  deletePhoto,
  getMyPhotos,
  deleteMyPhoto,
  updateMyPhoto,
  filterPublishedPhotobankUrls,
  PUBLIC_PHOTOBANK_FILTER,
  incrementPhotobankUsage,
  decrementPhotobankUsage,
  syncPhotobankUsageDiff,
};
