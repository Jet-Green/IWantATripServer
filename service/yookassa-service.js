const logger = require('../logger');

const EVENT_PAYMENT_SUCCEEDED = 'payment.succeeded';
const EVENT_PAYMENT_CANCELED = 'payment.canceled';

function parseIpv4ToInt(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const o = parseInt(p, 10);
    if (Number.isNaN(o) || o < 0 || o > 255) return null;
    n = ((n << 8) + o) >>> 0;
  }
  return n;
}

function ipv4InCidr(ip, network, prefixLen) {
  const ipInt = parseIpv4ToInt(ip);
  const netInt = parseIpv4ToInt(network);
  if (ipInt == null || netInt == null) return false;
  const mask = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  return (ipInt & mask) === (netInt & mask);
}

/**
 * Диапазоны из https://yookassa.ru/developers/using-api/webhooks (раздел «Аутентификация уведомлений»)
 */
function isYooKassaWebhookIp(ip) {
  if (!ip || typeof ip !== 'string') return false;
  const v4 = ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  if (v4.includes('.') && !v4.includes(':')) {
    if (ipv4InCidr(v4, '185.71.76.0', 27)) return true;
    if (ipv4InCidr(v4, '185.71.77.0', 27)) return true;
    if (ipv4InCidr(v4, '77.75.153.0', 25)) return true;
    if (ipv4InCidr(v4, '77.75.154.128', 25)) return true;
    if (v4 === '77.75.156.11' || v4 === '77.75.156.35') return true;
    return false;
  }
  const lower = ip.toLowerCase();
  const m = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})/i.exec(lower);
  if (!m) return false;
  const first = parseInt(m[1], 16);
  const second = parseInt(m[2], 16);
  return first === 0x2a02 && second === 0x5180;
}

module.exports = {
  EVENT_PAYMENT_SUCCEEDED,
  EVENT_PAYMENT_CANCELED,
  isYooKassaWebhookIp,

  /**
   * Обработка HTTP-уведомления ЮKassa (тело POST — JSON из документации).
   * Пока только логирование, без записи в БД.
   * @returns {{ httpStatus: number }}
   */
  handleNotification(body, clientIp) {
    const strictIp = process.env.YOOKASSA_WEBHOOK_STRICT_IP === 'true';
    if (strictIp && !isYooKassaWebhookIp(clientIp)) {
      logger.warn({ clientIp, logType: 'yookassa webhook' }, 'yookassa: отклонено по IP');
      return { httpStatus: 403 };
    }

    if (!body || body.type !== 'notification' || typeof body.event !== 'string' || !body.object) {
      logger.warn({ logType: 'yookassa webhook' }, 'yookassa: некорректное тело уведомления');
      return { httpStatus: 200 };
    }

    const { event, object: payment } = body;

    if (event !== EVENT_PAYMENT_SUCCEEDED && event !== EVENT_PAYMENT_CANCELED) {
      return { httpStatus: 200 };
    }

    logger.info(
      {
        logType: 'yookassa webhook',
        event,
        paymentId: payment.id,
        status: payment.status,
        paid: payment.paid,
        amount: payment.amount,
        description: payment.description,
        metadata: payment.metadata,
        cancellation_details: payment.cancellation_details,
      },
      'yookassa: уведомление о платеже'
    );

    return { httpStatus: 200 };
  },
};
