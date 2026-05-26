const logger = require('../logger')
const { createTripSplitPayment } = require('../service/yookassa-trip-payment-service')
const { applyYookassaNotification, isYookassaIp } = require('../service/yookassa-notification-service')

module.exports = {
  /**
   * POST /payments/yookassa/webhook
   */
  async webhook(req, res, next) {
    try {
      if (!isYookassaIp(req)) {
        logger.warn({ logType: 'yookassa-notification' }, 'запрос с неизвестного IP')
        return res.status(403).json({ message: 'Forbidden' })
      }

      const body = req.body && typeof req.body === 'object' ? req.body : {}
      if (body.type !== 'notification' || !body.event || !body.object) {
        return res.status(400).json({ message: 'Некорректное уведомление' })
      }

      await applyYookassaNotification(body)
      return res.status(200).send()
    } catch (e) {
      logger.fatal({ error: e, logType: 'yookassa-notification' }, 'ошибка webhook')
      next(e)
    }
  },

  /**
   * POST /payments/yookassa/trip-payment
   * body: { billId, tripId, returnUrl? }
   */
  async createTripPayment(req, res, next) {
    try {
      const { billId, tripId, returnUrl } = req.body || {}
      if (!billId || !tripId) {
        return res.status(400).json({ message: 'Укажите billId и tripId' })
      }

      const result = await createTripSplitPayment({ billId, tripId, returnUrl })
      return res.json(result)
    } catch (e) {
      if (e.statusCode) {
        return res.status(e.statusCode).json({ message: e.message })
      }
      logger.fatal({ error: e, logType: 'yookassa-payment' }, 'ошибка создания платежа')
      next(e)
    }
  },
}
