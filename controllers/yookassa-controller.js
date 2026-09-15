const logger = require('../logger')
const { createTripPayment } = require('../service/yookassa-trip-payment-service')
const { applyYookassaNotification } = require('../service/yookassa-notification-service')

module.exports = {
  async createTripPayment(req, res, next) {
    try {
      const { billId, tripId, returnUrl } = req.body || {}
      if (!billId || !tripId) {
        return res.status(400).json({ message: 'Укажите billId и tripId' })
      }

      const result = await createTripPayment({
        billId,
        tripId,
        returnUrl,
        clientEmail: req.user?.email,
      })
      return res.json(result)
    } catch (error) {
      if (error.statusCode) return res.status(error.statusCode).json({ message: error.message })
      logger.fatal({ error, logType: 'yookassa-payment' }, 'ошибка создания платежа')
      next(error)
    }
  },

  async webhook(req, res, next) {
    try {
      const body = req.body && typeof req.body === 'object' ? req.body : {}
      if (body.type !== 'notification' || !body.event || !body.object) {
        return res.status(400).json({ message: 'Некорректное уведомление' })
      }

      await applyYookassaNotification(body)

      // Всегда отвечаем 200: подлинность платежа проверена запросом к ЮKassa,
      // а 5xx заставил бы её повторять уведомление по кругу.
      return res.status(200).send()
    } catch (error) {
      logger.fatal({ error, logType: 'yookassa-notification' }, 'ошибка webhook')
      return res.status(200).send()
    }
  },
}

