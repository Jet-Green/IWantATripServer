const BillModel = require('../models/bill-model')
const TripModel = require('../models/trip-model')
const { createPayment } = require('./yookassa-client')
const { yookassaAccountId } = require('./yookassa-contract-helper')

function formatMoneyRub(amountRub) {
  const n = Number(amountRub)
  if (!Number.isFinite(n) || n <= 0) {
    const err = new Error('Некорректная сумма платежа')
    err.statusCode = 400
    throw err
  }
  return n.toFixed(2)
}

function calcBillTotalRub(bill) {
  let total = 0
  for (const item of bill.cart || []) {
    const count = Number(item.count) || 0
    if (count > 0) {
      total += Number(item.cost) * count
    }
  }
  for (const s of bill.additionalServices || []) {
    const count = Number(s.count) || 0
    if (count > 0) {
      total += Number(s.price) * count
    }
  }
  return total
}

function resolveSellerAccountId(trip) {
  const fromTrip = yookassaAccountId(trip?.tinkoffContract) || trip?.yookassaSellerAccountId
  if (fromTrip) return fromTrip

  const fromAuthor = yookassaAccountId(trip?.author?.tinkoffContract)
  if (fromAuthor) return fromAuthor

  const fromEnv = process.env.YOOKASSA_SELLER_ACCOUNT_ID
  if (fromEnv) return String(fromEnv).trim()

  const err = new Error(
    'Не настроен ShopId продавца в ЮKassa. Подключите магазин в личном кабинете или при создании тура.'
  )
  err.statusCode = 400
  throw err
}

function buildTransferDescription(trip, bill) {
  const name = trip?.name ? String(trip.name).trim() : 'Тур'
  return `Заказ тура: ${name}`.slice(0, 128)
}

/**
 * Создаёт сплит-платёж ЮKassa для счёта тура (комиссия платформы 0).
 * @param {{ billId: string, tripId: string, returnUrl: string }} params
 */
async function createTripSplitPayment({ billId, tripId, returnUrl }) {
  const bill = await BillModel.findById(billId)
  if (!bill) {
    const err = new Error('Счёт не найден')
    err.statusCode = 404
    throw err
  }

  const trip = await TripModel.findById(tripId).populate({
    path: 'author',
    populate: { path: 'tinkoffContract', select: 'yookassa fullName inn' },
  })
  if (!trip) {
    const err = new Error('Тур не найден')
    err.statusCode = 404
    throw err
  }

  if (!trip.privetMirBonusProgram) {
    const err = new Error('Тур не участвует в бонусной программе «Привет, мир»')
    err.statusCode = 400
    throw err
  }

  if (bill.yookassa?.paymentId && bill.yookassa?.status === 'pending') {
    return {
      paymentId: bill.yookassa.paymentId,
      confirmationUrl: bill.yookassa.confirmationUrl,
      status: bill.yookassa.status,
    }
  }

  const totalRub = calcBillTotalRub(bill)
  const totalStr = formatMoneyRub(totalRub)
  const sellerAccountId = resolveSellerAccountId(trip)
  const sellerName =
    trip.tinkoffContract?.Name || trip.tinkoffContract?.name || 'Организатор тура'

  const payload = {
    amount: { value: totalStr, currency: 'RUB' },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: returnUrl || process.env.CLIENT_URL || 'https://gorodaivesi.ru',
    },
    description: `${sellerName}: ${totalStr} руб.`.slice(0, 128),
    metadata: {
      billId: String(billId),
      tripId: String(tripId),
      source: 'trip-privet-mir',
    },
    transfers: [
      {
        account_id: sellerAccountId,
        amount: { value: totalStr, currency: 'RUB' },
        platform_fee_amount: { value: '0.00', currency: 'RUB' },
        description: buildTransferDescription(trip, bill),
        metadata: {
          billId: String(billId),
          tripId: String(tripId),
        },
      },
    ],
  }

  const payment = await createPayment(payload)

  const confirmationUrl = payment?.confirmation?.confirmation_url || null
  const yookassa = {
    paymentId: payment.id,
    status: payment.status,
    amount: totalStr,
    confirmationUrl,
    sellerAccountId,
    platformFee: '0.00',
    createdAt: new Date(),
  }

  await BillModel.findByIdAndUpdate(billId, { $set: { yookassa } })

  return {
    paymentId: payment.id,
    confirmationUrl,
    status: payment.status,
  }
}

module.exports = {
  calcBillTotalRub,
  createTripSplitPayment,
}
