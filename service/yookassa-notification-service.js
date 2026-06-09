const BillModel = require('../models/bill-model')
const logger = require('../logger')
const { getPayment } = require('./yookassa-client')

async function applyYookassaNotification(notification) {
  const payment = notification?.object
  if (!payment?.id) {
    return { ok: false, reason: 'payment_id_missing' }
  }

  const paymentId = String(payment.id)
  const billId = payment.metadata?.billId

  const bill =
    (billId && (await BillModel.findById(billId))) ||
    (await BillModel.findOne({ 'yookassa.paymentId': paymentId }))

  if (!bill) {
    logger.warn({ paymentId, logType: 'yookassa-notification' }, 'счёт по уведомлению не найден')
    return { ok: false, reason: 'bill_not_found' }
  }

  const amount = Number(payment.amount?.value || 0)
  const status = payment.status

  const update = {
    'yookassa.status': status,
    'yookassa.notificationAt': new Date(),
  }
  if (status === 'succeeded') {
    update['yookassa.paidAt'] = new Date()
    update['payment.amount'] = amount
  }

  await BillModel.findByIdAndUpdate(bill._id, { $set: update })
  return { ok: true, billId: String(bill._id), status }
}

async function verifyYookassaPayment(paymentId) {
  try {
    return await getPayment(paymentId)
  } catch (error) {
    logger.warn({ paymentId, error, logType: 'yookassa-notification' }, 'не удалось подтвердить платёж через API')
    return null
  }
}

module.exports = {
  applyYookassaNotification,
  verifyYookassaPayment,
}

