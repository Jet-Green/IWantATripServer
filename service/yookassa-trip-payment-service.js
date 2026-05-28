const BillModel = require('../models/bill-model')
const TripModel = require('../models/trip-model')
const { createPayment } = require('./yookassa-client')

const ALLOWED_INN = () => String(process.env.YOOKASSA_ALLOWED_CONTRACT_INN || '1837013663').trim()
const RECEIPT_VAT_CODE = () => Number(process.env.YOOKASSA_RECEIPT_VAT_CODE || 1)
const TAX_SYSTEM_CODE = () => Number(process.env.YOOKASSA_TAX_SYSTEM_CODE || 2)

function calcBillTotalRub(bill) {
  let total = 0
  for (const item of bill.cart || []) {
    const count = Number(item.count) || 0
    if (count > 0) total += Number(item.cost) * count
  }
  for (const service of bill.additionalServices || []) {
    const count = Number(service.count) || 0
    if (count > 0) total += Number(service.price) * count
  }
  return total
}

function normalizePhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`
  if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`
  if (digits.length === 10) return `+7${digits}`
  return `+${digits}`
}

function buildReceiptItem(description, unitPriceRub, quantity) {
  const count = Number(quantity) || 0
  const price = Number(unitPriceRub) || 0
  if (count <= 0 || price <= 0) return null

  return {
    description: String(description || 'Услуга').slice(0, 128),
    quantity: count.toFixed(2),
    amount: { value: price.toFixed(2), currency: 'RUB' },
    vat_code: RECEIPT_VAT_CODE(),
    payment_mode: 'full_payment',
    payment_subject: 'service',
  }
}

function buildReceipt(bill, trip, clientEmail) {
  const tripName = String(trip?.name || 'Тур')
  const items = []

  for (const cartItem of bill.cart || []) {
    const item = buildReceiptItem(
      `${cartItem.costType || 'Услуга'}: ${tripName}`,
      cartItem.cost,
      cartItem.count,
    )
    if (item) items.push(item)
  }

  for (const service of bill.additionalServices || []) {
    const item = buildReceiptItem(
      `${service.name || 'Доп. услуга'}: ${tripName}`,
      service.price,
      service.count,
    )
    if (item) items.push(item)
  }

  if (!items.length) {
    const err = new Error('Не удалось сформировать позиции чека')
    err.statusCode = 400
    throw err
  }

  const customer = {}
  const email = String(clientEmail || '').trim()
  if (email) {
    customer.email = email
  } else {
    const phone = normalizePhone(bill.userInfo?.phone)
    if (phone) customer.phone = phone
  }

  if (!customer.email && !customer.phone) {
    const err = new Error('Для чека нужен email или телефон покупателя')
    err.statusCode = 400
    throw err
  }

  return {
    customer,
    items,
    tax_system_code: TAX_SYSTEM_CODE(),
  }
}

function ensureAllowedInn(trip) {
  const allowedInn = ALLOWED_INN()
  if (!allowedInn) return
  const tripInn = String(trip?.tinkoffContract?.Inn || '').trim()
  if (tripInn !== allowedInn) {
    const err = new Error(`Оплата через ЮKassa доступна только для договора с ИНН ${allowedInn}`)
    err.statusCode = 403
    throw err
  }
}

async function createTripPayment({ billId, tripId, returnUrl, clientEmail }) {
  const bill = await BillModel.findById(billId)
  if (!bill) {
    const err = new Error('Счёт не найден')
    err.statusCode = 404
    throw err
  }

  const trip = await TripModel.findById(tripId)
  if (!trip) {
    const err = new Error('Тур не найден')
    err.statusCode = 404
    throw err
  }

  if (!trip.privetMirYookassaEnabled) {
    const err = new Error('Для этого тура оплата через ЮKassa не включена')
    err.statusCode = 400
    throw err
  }

  ensureAllowedInn(trip)

  if (bill.yookassa?.paymentId && bill.yookassa?.status === 'pending') {
    return {
      paymentId: bill.yookassa.paymentId,
      confirmationUrl: bill.yookassa.confirmationUrl,
      status: bill.yookassa.status,
    }
  }

  const amountRub = calcBillTotalRub(bill)
  if (!Number.isFinite(amountRub) || amountRub <= 0) {
    const err = new Error('Некорректная сумма счёта')
    err.statusCode = 400
    throw err
  }

  const amount = amountRub.toFixed(2)
  const payload = {
    amount: { value: amount, currency: 'RUB' },
    capture: true,
    confirmation: {
      type: 'redirect',
      return_url: returnUrl || process.env.CLIENT_URL || 'https://gorodaivesi.ru',
    },
    description: `Оплата тура: ${String(trip.name || 'Тур').slice(0, 90)}`,
    receipt: buildReceipt(bill, trip, clientEmail),
    metadata: {
      billId: String(billId),
      tripId: String(tripId),
      flow: 'trip-yookassa-basic',
    },
  }

  const payment = await createPayment(payload)
  const confirmationUrl = payment?.confirmation?.confirmation_url || null

  await BillModel.findByIdAndUpdate(billId, {
    $set: {
      yookassa: {
        paymentId: payment.id,
        status: payment.status,
        amount,
        confirmationUrl,
        createdAt: new Date(),
      },
    },
  })

  return {
    paymentId: payment.id,
    confirmationUrl,
    status: payment.status,
  }
}

module.exports = {
  createTripPayment,
}

