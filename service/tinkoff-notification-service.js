const BillModel = require('../models/bill-model')
const ExcursionBillModel = require('../models/excursion-bill-model')
const logger = require('../logger')

/**
 * Обрабатывает уведомление об оплате: обновляет сумму по туру или снимает needPay с экскурсии.
 * Идемпотентно: повторные уведомления с тем же CONFIRMED перезаписывают те же значения.
 */
async function applyPaymentNotification(body) {
  const { PaymentId, OrderId, Status, Success, Amount, TerminalKey } = body

  const terminalKey = process.env.TINKOFF_TERMINAL_KEY || process.env.TINKOFF_TERMINAL_ID
  if (terminalKey && String(TerminalKey) !== String(terminalKey)) {
    logger.warn({ TerminalKey, logType: 'tinkoff-notification' }, 'чужой TerminalKey')
    return { ok: false, reason: 'terminal_mismatch' }
  }

  if (Success === false || Success === 'false') {
    return { ok: true, updated: false, reason: 'success_false' }
  }

  if (Status !== 'CONFIRMED') {
    return { ok: true, updated: false, reason: `status_${Status}` }
  }

  const paymentIdStr = PaymentId != null ? String(PaymentId) : ''
  const orderIdStr = OrderId != null ? String(OrderId) : ''
  if (!paymentIdStr && !orderIdStr) {
    return { ok: false, reason: 'no_payment_or_order' }
  }

  const amountRub = Amount != null ? Number(Amount) / 100 : 0

  const filterByPayment = paymentIdStr ? { 'tinkoff.paymentId': paymentIdStr } : null
  const filterByOrder = orderIdStr ? { 'tinkoff.orderId': orderIdStr } : null

  let tripBill = null
  if (filterByPayment) {
    tripBill = await BillModel.findOneAndUpdate(
      filterByPayment,
      {
        $set: {
          'payment.amount': amountRub,
          'tinkoff.notificationStatus': Status,
          'tinkoff.notificationAt': new Date(),
        },
      },
      { new: true }
    )
  }
  if (!tripBill && filterByOrder) {
    tripBill = await BillModel.findOneAndUpdate(
      filterByOrder,
      {
        $set: {
          'payment.amount': amountRub,
          'tinkoff.notificationStatus': Status,
          'tinkoff.notificationAt': new Date(),
          ...(paymentIdStr ? { 'tinkoff.paymentId': paymentIdStr } : {}),
        },
      },
      { new: true }
    )
  }

  if (tripBill) {
    logger.info(
      { billId: tripBill._id, PaymentId: paymentIdStr, amountRub, logType: 'tinkoff-notification' },
      'обновлён счёт тура'
    )
    return { ok: true, updated: true, type: 'trip_bill' }
  }

  let exBill = null
  if (filterByPayment) {
    exBill = await ExcursionBillModel.findOneAndUpdate(
      filterByPayment,
      {
        $set: {
          needPay: false,
          'tinkoff.notificationStatus': Status,
          'tinkoff.notificationAt': new Date(),
        },
      },
      { new: true }
    )
  }
  if (!exBill && filterByOrder) {
    exBill = await ExcursionBillModel.findOneAndUpdate(
      filterByOrder,
      {
        $set: {
          needPay: false,
          'tinkoff.notificationStatus': Status,
          'tinkoff.notificationAt': new Date(),
          ...(paymentIdStr ? { 'tinkoff.paymentId': paymentIdStr } : {}),
        },
      },
      { new: true }
    )
  }

  if (exBill) {
    logger.info(
      { billId: exBill._id, PaymentId: paymentIdStr, logType: 'tinkoff-notification' },
      'обновлён счёт экскурсии'
    )
    return { ok: true, updated: true, type: 'excursion_bill' }
  }

  logger.warn(
    { PaymentId: paymentIdStr, OrderId: orderIdStr, logType: 'tinkoff-notification' },
    'счёт не найден'
  )
  return { ok: true, updated: false, reason: 'bill_not_found' }
}

module.exports = { applyPaymentNotification }
