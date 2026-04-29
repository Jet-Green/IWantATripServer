const YaPhotobank = require('./photos-bucket');
const { compressPhotobankImage } = require('./photobank-compress');

async function listFiles() {
  try {
    return await YaPhotobank.listPublicFileUrls();
  } catch (error) {
    console.error('Ошибка при получении списка файлов:', error);
    return [];
  }
}

/**
 * Загрузка в бакет — по образцу nmp-backend: YaCloud.Upload({ file, path, fileName }), цикл по файлам.
 * @param {Express.Multer.File[]} files из multer (.buffer, .originalname, .mimetype)
 * @param {string} userId id пользователя (из JWT) для имени файла: `${timestamp}_${userId}.jpg`
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
  const urls = [];

  for (const file of files) {
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

    const fileName = `${Date.now()}_${safeUserId}.jpg`;
    const uploadResult = await YaPhotobank.Upload({
      file: { buffer: compressedBuffer, mimetype: 'image/jpeg' },
      path: 'photobank',
      fileName,
    });

    if (uploadResult && uploadResult.Location) {
      urls.push(uploadResult.Location);
    }
  }

  return urls;
}

module.exports = {
  async getPhotos(page) {
    const limit = 24;
    try {
      let photos = await listFiles();
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const resultPhotos = photos.slice(startIndex, endIndex);
      return resultPhotos;
    } catch (error) {
      throw error;
    }
  },

  uploadPhotobankPhotos,
};
