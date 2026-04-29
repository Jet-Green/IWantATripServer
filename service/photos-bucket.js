/**
 * Образец: nmp-backend/src/s3/bucket.ts — загрузка в Yandex Object Storage через aws-sdk.S3.upload
 * Бакет только из PHOTOBANK_BUCKET_NAME (как при get-photos в photos-service).
 */
const AWS = require('aws-sdk');

function getPhotobankBucketName() {
  const name = process.env.PHOTOBANK_BUCKET_NAME;
  if (!name || !String(name).trim()) {
    return null;
  }
  return String(name).trim();
}

class PhotobankYandexCloud {
  constructor() {
    this.aws = new AWS.S3({
      endpoint: 'https://storage.yandexcloud.net',
      accessKeyId: process.env.YC_KEY_ID,
      secretAccessKey: process.env.YC_SECRET,
      region: 'ru-central1',
      httpOptions: {
        timeout: 10000,
        connectTimeout: 10000,
      },
    });
  }

  /**
   * Публичный URL объекта (virtual-hosted style, Yandex Object Storage).
   */
  publicUrlForKey(bucketName, key) {
    const path = String(key)
      .split('/')
      .filter(Boolean)
      .map((segment) => encodeURIComponent(segment))
      .join('/');
    return `https://${bucketName}.storage.yandexcloud.net/${path}`;
  }

  /**
   * Список публичных URL всех объектов в бакете фотобанка (aws-sdk listObjectsV2 + пагинация).
   */
  listPublicFileUrls = async () => {
    const bucketName = getPhotobankBucketName();
    if (!bucketName) {
      console.warn('[photobank] PHOTOBANK_BUCKET_NAME не задан — список фото пуст');
      return [];
    }

    const items = [];
    let continuationToken;

    do {
      const params = { Bucket: bucketName };
      if (continuationToken) {
        params.ContinuationToken = continuationToken;
      }
      const resp = await this.aws.listObjectsV2(params).promise();

      if (resp.Contents && resp.Contents.length) {
        for (const obj of resp.Contents) {
          if (obj.Key && !obj.Key.endsWith('/')) {
            items.push({
              Key: obj.Key,
              LastModified: obj.LastModified ? new Date(obj.LastModified).getTime() : 0,
            });
          }
        }
      }

      continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
    } while (continuationToken);

    items.sort((a, b) => b.LastModified - a.LastModified);

    return items.map(({ Key }) => this.publicUrlForKey(bucketName, Key));
  };

  /**
   * @param {{ buffer: Buffer, mimetype?: string }} file
   * @param {string} path без ведущего слэша, напр. photobank
   * @param {string} fileName имя файла в ключе `${path}/${fileName}`
   */
  Upload = async ({ file, path, fileName }) => {
    const bucketName = getPhotobankBucketName();
    if (!bucketName) {
      const err = new Error('PHOTOBANK_BUCKET_NAME не задан в окружении');
      err.statusCode = 500;
      throw err;
    }

    const contentType =
      file.mimetype ||
      file.mimeType ||
      'application/octet-stream';

    const key = `${String(path || '')
      .replace(/^\/+|\/+$/g, '')}/${fileName}`.replace(/\/+/g, '/');

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: contentType,
    };

    const aws = this.aws;
    try {
      const result = await new Promise((resolve, reject) => {
        aws.upload(params, (err, data) => {
          if (err) return reject(err);
          resolve(data);
        });
      });
      return result;
    } catch (e) {
      console.error('[photobank] Upload error:', e);
      throw e;
    }
  };
}

module.exports = new PhotobankYandexCloud();
