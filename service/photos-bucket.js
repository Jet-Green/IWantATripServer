/**
 * Образец: nmp-backend/src/s3/bucket.ts — загрузка в Yandex Object Storage через aws-sdk.S3.upload
 * Бакет: PHOTOBANK_BUCKET_NAME.
 * Ключи Object Storage для фотобанка (отдельно от основного S3): PHOTOBANK_YC_KEY_ID, PHOTOBANK_YC_SECRET.
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
    const accessKeyId = String(process.env.PHOTOBANK_YC_KEY_ID || '').trim();
    const secretAccessKey = String(process.env.PHOTOBANK_YC_SECRET || '').trim();
    this.aws = new AWS.S3({
      endpoint: 'https://storage.yandexcloud.net',
      accessKeyId,
      secretAccessKey,
      region: 'ru-central1',
      httpOptions: {
        timeout: 10000,
        connectTimeout: 10000,
      },
    });
    this.photobankCredsOk = Boolean(accessKeyId && secretAccessKey);
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
    if (!this.photobankCredsOk) {
      console.warn('[photobank] PHOTOBANK_YC_KEY_ID / PHOTOBANK_YC_SECRET не заданы — список пуст');
      return [];
    }
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
    if (!this.photobankCredsOk) {
      const err = new Error('PHOTOBANK_YC_KEY_ID и PHOTOBANK_YC_SECRET должны быть заданы в окружении');
      err.statusCode = 500;
      throw err;
    }
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
