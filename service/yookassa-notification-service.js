const BillModel = require('../models/bill-model')
const logger = require('../logger')
const { getPayment } = require('./yookassa-client')

/**
 * @param {import('express').Request} req
 */
function isYookassaIp(req) {
  const allowlist = (process.env.YOOKASSA_WEBHOOK_IPS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!allowlist.length) return true
  const ip =
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    ''
  return allowlist.some((subnet) => ip.includes(subnet) || ip === subnet)
}

/**
 * @param {{ type: string, event: string, object: object }} notification
 */
async function applyYookassaNotification(notification) {
  const event = notification?.event
  const payment = notification?.object
  if (!payment?.id) {
    return { ok: false, reason: 'no_payment_id' }
  }

  const paymentId = String(payment.id)
  const metadata = payment.metadata || {}

  let bill =
    (metadata.billId && (await BillModel.findById(metadata.billId))) ||
    (await BillModel.findOne({ 'yookassa.paymentId': paymentId }))

  if (!bill) {
    logger.warn({ paymentId, logType: 'yookassa-notification' }, 'счёт не найден')
    return { ok: false, reason: 'bill_not_found' }
  }

  const status = payment.status
  const amountRub = payment.amount?.value != null ? Number(payment.amount.value) : 0

  if (event === 'payment.succeeded' || status === 'succeeded') {
    await BillModel.findByIdAndUpdate(bill._id, {
      $set: {
        'payment.amount': amountRub,
        'yookassa.status': status,
        'yookassa.paidAt': new Date(),
        'yookassa.notificationAt': new Date(),
      },
    })
    logger.info({ billId: bill._id, paymentId, logType: 'yookassa-notification' }, 'оплата тура')
    return { ok: true, updated: true, type: 'trip_bill' }
  }

  if (event === 'payment.canceled' || status === 'canceled') {
    await BillModel.findByIdAndUpdate(bill._id, {
      $set: {
        'yookassa.status': status,
        'yookassa.notificationAt': new Date(),
      },
    })
    return { ok: true, updated: true, type: 'trip_bill_canceled' }
  }

  await BillModel.findByIdAndUpdate(bill._id, {
    $set: {
      'yookassa.status': status,
      'yookassa.notificationAt': new Date(),
    },
  })

  return { ok: true, updated: false, status }
}

/**
 * Доп. проверка статуса через API (опционально).
 */
async function verifyPaymentStatus(paymentId) {
  try {
    return await getPayment(paymentId)
  } catch (e) {
    logger.warn({ paymentId, error: e, logType: 'yookassa-notification' }, 'не удалось запросить платёж')
    return null
  }
}

module.exports = {
  isYookassaIp,
  applyYookassaNotification,
  verifyPaymentStatus,
}
