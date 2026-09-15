const BillModel = require('../models/bill-model')
const logger = require('../logger')
const { getPayment } = require('./yookassa-client')

/**
 * Применяет уведомление ЮKassa к счёту.
 *
 * Телу уведомления не доверяем: маршрут вебхука открыт наружу, и раньше любой
 * мог прислать {status:'succeeded'} с чужим billId и пометить счёт оплаченным.
 * Из уведомления берём только идентификатор платежа, а состояние и сумму
 * перезапрашиваем у ЮKassa и решаем по её ответу.
 */
async function applyYookassaNotification(notification) {
  const notified = notification?.object
  if (!notified?.id) {
    return { ok: false, reason: 'payment_id_missing' }
  }

  const paymentId = String(notified.id)

  let payment
  try {
    payment = await getPayment(paymentId)
  } catch (error) {
    // Не смогли проверить — ничего не меняем. ЮKassa повторит уведомление.
    logger.error({ paymentId, error, logType: 'yookassa-notification' }, 'платёж не подтверждён через API, уведомление отклонено')
    return { ok: false, reason: 'verification_failed' }
  }

  if (!payment?.id || String(payment.id) !== paymentId) {
    logger.error({ paymentId, logType: 'yookassa-notification' }, 'ЮKassa не знает такого платежа')
    return { ok: false, reason: 'payment_not_found' }
  }

  // billId берём из данных ЮKassa, а не из присланного тела.
  const billId = payment.metadata?.billId

  const bill =
    (billId && (await BillModel.findById(billId))) ||
    (await BillModel.findOne({ 'yookassa.paymentId': paymentId }))

  if (!bill) {
    logger.warn({ paymentId, logType: 'yookassa-notification' }, 'счёт по уведомлению не найден')
    return { ok: false, reason: 'bill_not_found' }
  }

  const status = payment.status
  const amount = Number(payment.amount?.value || 0)

  const update = {
    'yookassa.status': status,
    'yookassa.notificationAt': new Date(),
  }

  if (status === 'succeeded') {
    // Сверяем с суммой, на которую платёж создавался: расхождение означает,
    // что оплатили не то, и счёт закрывать нельзя.
    const expected = Number(bill.yookassa?.amount || 0)
    if (expected > 0 && Math.abs(expected - amount) > 0.01) {
      logger.error(
        { paymentId, billId: String(bill._id), expected, amount, logType: 'yookassa-notification' },
        'сумма платежа не совпадает с суммой счёта, оплата не засчитана'
      )
      await BillModel.findByIdAndUpdate(bill._id, {
        $set: { 'yookassa.status': status, 'yookassa.amountMismatch': true, 'yookassa.notificationAt': new Date() },
      })
      return { ok: false, reason: 'amount_mismatch' }
    }

    update['yookassa.paidAt'] = new Date()
    update['payment.amount'] = amount
  }

  await BillModel.findByIdAndUpdate(bill._id, { $set: update })
  return { ok: true, billId: String(bill._id), status }
}

module.exports = {
  applyYookassaNotification,
}
