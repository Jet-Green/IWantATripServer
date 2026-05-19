const logger = require('../logger')
const { verifyNotificationToken } = require('../service/tinkoff-acquiring')
const { applyPaymentNotification } = require('../service/tinkoff-notification-service')

const TINKOFF_PASSWORD = () => process.env.TINKOFF_TERMINAL_PASSWORD || process.env.TINKOFF_PASSWORD

/**
 * POST /payments/tinkoff-notification
 * Уведомление Т‑Банка об изменении статуса платежа (NotificationURL).
 * Ответ "OK" — ожидаемый успешный ответ для повторных попыток доставки.
 */
async function tinkoffNotification(req, res) {
  try {
    const password = TINKOFF_PASSWORD()
    if (!password) {
      logger.error({ logType: 'tinkoff-notification' }, 'не задан TINKOFF_TERMINAL_PASSWORD')
      return res.status(503).type('text/plain').send('FAIL')
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {}
    if (!verifyNotificationToken(body, password)) {
      logger.warn({ logType: 'tinkoff-notification' }, 'неверный Token уведомления')
      return res.status(403).type('text/plain').send('FAIL')
    }

    await applyPaymentNotification(body)
    return res.status(200).type('text/plain').send('OK')
  } catch (e) {
    logger.fatal({ error: e, logType: 'tinkoff-notification' }, 'ошибка обработки уведомления')
    return res.status(500).type('text/plain').send('FAIL')
  }
}

module.exports = { tinkoffNotification }
