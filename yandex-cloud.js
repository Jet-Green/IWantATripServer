let EasyYandexS3 = require('easy-yandex-s3').default;

module.exports = s3 = new EasyYandexS3({
  auth: {
      accessKeyId: process.env.YC_KEY_ID,
      secretAccessKey: process.env.YC_SECRET,
  },
  Bucket: process.env.YC_BUCKET_NAME, // Название бакета
  debug: false, // Дебаг в консоли
});
