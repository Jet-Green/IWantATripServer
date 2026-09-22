const logger = require('../logger')
const { verifyNotificationToken } = require('../service/tinkoff-acquiring')
const { applyPaymentNotification } = require('../service/tinkoff-notification-service')
const tinkoffPayment = require('../service/tinkoff-payment-service')

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

/**
 * Общая обёртка: ошибки сервиса с statusCode отдаём как есть, остальное — в лог.
 * Сумму и состав чека считает сервер, клиент передаёт только номер счёта.
 */
function handle(logType, run) {
    return async (req, res, next) => {
        try {
            return res.json(await run(req))
        } catch (error) {
            if (error.statusCode) {
                logger.warn(
                    { message: error.message, code: error.tinkoffErrorCode, logType },
                    'платёж отклонён'
                )
                return res.status(error.statusCode).json({ message: error.message })
            }
            logger.fatal({ error, logType }, 'ошибка платежа')
            next(error)
        }
    }
}

const tripPayment = handle('tinkoff-trip-payment', (req) => {
    const { billId } = req.body || {}
    if (!billId) {
        const err = new Error('Укажите billId')
        err.statusCode = 400
        throw err
    }
    return tinkoffPayment.initTripPayment({ billId, clientEmail: req.user?.email })
})

const excursionPayment = handle('tinkoff-excursion-payment', (req) => {
    const { billId } = req.body || {}
    if (!billId) {
        const err = new Error('Укажите billId')
        err.statusCode = 400
        throw err
    }
    return tinkoffPayment.initExcursionPayment({ billId, clientEmail: req.user?.email })
})

const paymentState = handle('tinkoff-state', (req) => {
    const { billId, kind } = req.body || {}
    if (!billId) {
        const err = new Error('Укажите billId')
        err.statusCode = 400
        throw err
    }
    return tinkoffPayment.getPaymentState({ billId, kind })
})

const cancelPayment = handle('tinkoff-cancel', (req) => {
    const { billId, kind, amountRub, receipt } = req.body || {}
    if (!billId) {
        const err = new Error('Укажите billId')
        err.statusCode = 400
        throw err
    }
    return tinkoffPayment.cancelPayment({ billId, kind, amountRub, receipt })
})

module.exports = {
    tinkoffNotification,
    tripPayment,
    excursionPayment,
    paymentState,
    cancelPayment,
}
