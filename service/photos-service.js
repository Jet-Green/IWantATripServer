let EasyYandexS3 = require('easy-yandex-s3').default;

// Замените на ваши значения
const ACCESS_KEY_ID = process.env.YC_KEY_ID;
const SECRET_ACCESS_KEY = process.env.YC_SECRET;
const BUCKET_NAME = 'goroda-photos';
const REGION = 'ru-central1'; // Регион вашего бакета

// Инициализация клиента S3
const s3 = new EasyYandexS3({
  auth: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
  Bucket: BUCKET_NAME,
  debug: false, // Логирование запросов (true для включения)
});

async function listFiles() {
  try {
    const data = await s3.GetList('/');
    
    if (!data || !data.Contents || data.Contents.length === 0) {
      console.log('Бакет пустой');
      return [];
    }

    const fileUrls = data.Contents.map((file) => {
      return `https://${BUCKET_NAME}.storage.yandexcloud.net/${file.Key}`;
    });

    return fileUrls;
  } catch (error) {
    console.error('Ошибка при получении списка файлов:', error);
    return [];
  }
}

module.exports = {
    async getPhotos () {
       
        try {
            // console.log(await PostersModel.find({}))
            let photos = await listFiles()
            return  photos
        } catch (error) {
            next(error);
        }
    }
}