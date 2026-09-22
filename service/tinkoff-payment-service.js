const BillModel = require('../models/bill-model')
const ExcursionBillModel = require('../models/excursion-bill-model')
const TripModel = require('../models/trip-model')
const ExcursionDateModel = require('../models/excursion-date-model')
const { callAcquiring } = require('./tinkoff-client')

// Агент-посредник по 54-ФЗ: он же в чеке у всех позиций.
const AGENT = () => ({
    AgentSign: 'another',
    Phones: [process.env.TINKOFF_AGENT_PHONE || '+79128523316'],
    ReceiverPhones: [process.env.TINKOFF_AGENT_PHONE || '+79128523316'],
    OperatorName: process.env.TINKOFF_AGENT_NAME || 'Платформа Союз',
    OperatorAddress: process.env.TINKOFF_AGENT_ADDRESS || 'г.Глазов',
    OperatorInn: process.env.TINKOFF_AGENT_INN || '1837013960',
})

function fail(message, statusCode = 400) {
    const err = new Error(message)
    err.statusCode = statusCode
    throw err
}

function toKopecks(rub) {
    return Math.round(Number(rub) * 100)
}

/* ——— суммы по счёту тура ——— */

function billTotalRub(bill) {
    let total = 0
    for (const item of bill.cart || []) {
        total += (Number(item.cost) || 0) * (Number(item.count) || 0)
    }
    for (const service of bill.additionalServices || []) {
        total += (Number(service.price) || 0) * (Number(service.count) || 0)
    }
    return total
}

/**
 * Двухэтапная оплата включается программой лояльности тура.
 * Повторяет расчёт, который раньше жил в кабинете (BoughtTrips.vue):
 * держать его на клиенте нельзя — сумму можно было подменить в браузере.
 */
function isTwoStagePayment(bill, tour) {
    const discount = tour?.loyalty?.discount
    const hasPaymentOrder =
        tour?.loyalty?.enabled && tour?.loyalty?.type === 'discount' && discount?.paymentOrder
    if (!hasPaymentOrder) return false
    // Скидка зафиксирована, а платежей ещё не было — платим сразу всё.
    if (discount.isFixed && !(bill.payment?.amount > 0)) return false
    return true
}

function firstPaymentRub(bill, tour) {
    if (!isTwoStagePayment(bill, tour)) return billTotalRub(bill)
    const [firstPart] = String(tour.loyalty.discount.paymentOrder).split('/').map(Number)
    return Math.round(billTotalRub(bill) * (firstPart / 100))
}

function totalDiscountRub(bill, tour) {
    const perPerson = Number(tour?.loyalty?.discount?.fixedDiscountPerPerson) || 0
    if (perPerson <= 0) return 0
    const people = (bill.cart || []).reduce((sum, item) => sum + (Number(item.count) || 0), 0)
    return perPerson * people
}

function secondPaymentRub(bill, tour) {
    if (!isTwoStagePayment(bill, tour)) return 0
    const rest = billTotalRub(bill) - firstPaymentRub(bill, tour) - totalDiscountRub(bill, tour)
    return Math.max(0, rest)
}

/** Сколько осталось заплатить по счёту прямо сейчас. */
function remainingPaymentRub(bill, tour) {
    const paid = Number(bill.payment?.amount) || 0
    if (!isTwoStagePayment(bill, tour)) return billTotalRub(bill) - paid

    const first = firstPaymentRub(bill, tour)
    if (paid < first) return first - paid
    return Math.max(0, secondPaymentRub(bill, tour) - (paid - first))
}

/* ——— позиции чека ——— */

function buildItem({ name, priceRub, count, tripName, shopInfo }) {
    return {
        AgentData: {
            ...AGENT(),
            OperationName: `"${name}":${tripName}`.slice(0, 24),
        },
        SupplierInfo: {
            Phones: shopInfo.Phones,
            Name: shopInfo.Name,
            Inn: shopInfo.Inn,
        },
        PaymentMethod: 'full_payment',
        PaymentObject: 'service',
        Name: name,
        Price: toKopecks(priceRub),
        Quantity: count,
        Amount: toKopecks(priceRub) * count,
        Tax: 'none',
        ShopCode: String(shopInfo.ShopCode),
        MeasurementUnit: 'шт',
    }
}

/**
 * Позиции чека по счёту тура. `ratio` меньше единицы при двухэтапной оплате:
 * цены уменьшаются пропорционально, чтобы сумма чека сошлась с суммой платежа.
 */
function buildTripItems(bill, tour, ratio) {
    const tripName = String(tour.name || 'Тур')
    const shopInfo = tour.tinkoffContract
    const items = []

    for (const item of bill.cart || []) {
        const count = Number(item.count) || 0
        if (count <= 0) continue
        items.push(buildItem({
            name: item.costType || 'Услуга',
            priceRub: Math.round(Number(item.cost) * ratio * 100) / 100,
            count,
            tripName,
            shopInfo,
        }))
    }

    for (const service of bill.additionalServices || []) {
        const count = Number(service.count) || 0
        if (count <= 0) continue
        items.push(buildItem({
            name: service.name || 'Доп. услуга',
            priceRub: Math.round(Number(service.price) * ratio * 100) / 100,
            count,
            tripName,
            shopInfo,
        }))
    }

    if (!items.length) fail('Не удалось сформировать позиции чека')
    return items
}

function receiptEmail(bill, clientEmail) {
    const email = String(clientEmail || '').trim()
    if (email) return email
    fail('Для чека нужен email покупателя. Укажите его в профиле')
}

/* ——— создание платежа ——— */

async function initTripPayment({ billId, clientEmail }) {
    const bill = await BillModel.findById(billId)
    if (!bill) fail('Счёт не найден', 404)

    const trip = await TripModel.findById(bill.tripId)
    if (!trip) fail('Тур не найден', 404)

    // Платят за выбранную дату — это часто дочерний выезд. Договор, название
    // и программа лояльности живут у основного тура.
    const tour = trip.parent ? ((await TripModel.findById(trip.parent)) || trip) : trip

    const shopInfo = tour.tinkoffContract
    if (!shopInfo?.ShopCode) fail('У тура не настроен договор для оплаты')

    const totalRub = billTotalRub(bill)
    const remainingRub = remainingPaymentRub(bill, tour)
    if (!(remainingRub > 0)) fail('Счёт уже оплачен')

    const ratio = totalRub > 0 ? remainingRub / totalRub : 1
    const items = buildTripItems(bill, tour, ratio)
    const amount = items.reduce((sum, item) => sum + item.Amount, 0)

    const orderId = `${billId}-${Date.now()}`
    const description = `Покупка "${String(tour.name || 'Тур')}"`.slice(0, 250)

    const data = await callAcquiring('Init', {
        Amount: amount,
        OrderId: orderId,
        Description: description,
        NotificationURL: notificationUrl(),
    }, {
        Receipt: {
            Email: receiptEmail(bill, clientEmail),
            Taxation: 'usn_income',
            FfdVersion: '1.05',
            Items: items,
        },
        Shops: [{ ShopCode: String(shopInfo.ShopCode), Name: 'Тур', Amount: amount }],
    })

    await BillModel.findByIdAndUpdate(billId, {
        $set: {
            tinkoff: {
                orderId,
                paymentId: String(data.PaymentId),
                amount,
                status: data.Status,
                paymentUrl: data.PaymentURL,
                createdAt: new Date(),
            },
        },
    })

    return {
        paymentUrl: data.PaymentURL,
        paymentId: String(data.PaymentId),
        orderId,
        amountRub: amount / 100,
        status: data.Status,
    }
}

async function initExcursionPayment({ billId, clientEmail }) {
    const bill = await ExcursionBillModel.findById(billId)
    if (!bill) fail('Счёт не найден', 404)

    // Счёт привязан ко времени, а не к экскурсии: идём через даты, как в excursion-service.
    const dateDoc = await ExcursionDateModel.findOne({ times: { $elemMatch: { _id: bill.time } } })
        .populate({ path: 'excursion', select: { name: 1, tinkoffContract: 1 } })
    const excursion = dateDoc?.excursion
    if (!excursion) fail('Экскурсия не найдена', 404)

    const shopInfo = excursion.tinkoffContract
    if (!shopInfo?.ShopCode) fail('У экскурсии не настроен договор для оплаты')

    const excursionName = String(excursion.name || 'Экскурсия')
    const items = []
    for (const item of bill.cart || []) {
        const count = Number(item.count) || 0
        if (count <= 0) continue
        items.push(buildItem({
            // В корзине экскурсии позиция называется type, в туре — costType.
            name: item.type || item.costType || item.name || 'Услуга',
            priceRub: Number(item.price),
            count,
            tripName: excursionName,
            shopInfo,
        }))
    }
    if (!items.length) fail('Не удалось сформировать позиции чека')

    const amount = items.reduce((sum, item) => sum + item.Amount, 0)
    if (!(amount > 0)) fail('Некорректная сумма счёта')

    const orderId = `ex-${billId}-${Date.now()}`

    const data = await callAcquiring('Init', {
        Amount: amount,
        OrderId: orderId,
        Description: `Покупка "${excursionName}"`.slice(0, 250),
        NotificationURL: notificationUrl(),
    }, {
        Receipt: {
            Email: receiptEmail(bill, clientEmail),
            Taxation: 'usn_income',
            FfdVersion: '1.05',
            Items: items,
        },
        Shops: [{ ShopCode: String(shopInfo.ShopCode), Name: 'Экскурсия', Amount: amount }],
    })

    await ExcursionBillModel.findByIdAndUpdate(billId, {
        $set: {
            tinkoff: {
                orderId,
                paymentId: String(data.PaymentId),
                amount,
                status: data.Status,
                paymentUrl: data.PaymentURL,
                createdAt: new Date(),
            },
        },
    })

    return {
        paymentUrl: data.PaymentURL,
        paymentId: String(data.PaymentId),
        orderId,
        amountRub: amount / 100,
        status: data.Status,
    }
}

function notificationUrl() {
    const explicit = process.env.TINKOFF_NOTIFICATION_URL
    if (explicit) return explicit
    const base = String(process.env.API_URL || process.env.CLIENT_URL || '').replace(/\/$/, '')
    return base ? `${base}/payments/tinkoff-notification` : undefined
}

/* ——— статус и отмена ——— */

function modelFor(kind) {
    return kind === 'excursion' ? ExcursionBillModel : BillModel
}

/**
 * Состояние платежа в банке. Уведомление может не дойти, поэтому кабинет
 * дополнительно спрашивает статус сам — и здесь же записывает оплату в счёт.
 */
async function getPaymentState({ billId, kind }) {
    const bill = await modelFor(kind).findById(billId)
    if (!bill) fail('Счёт не найден', 404)
    if (!bill.tinkoff?.paymentId) return { status: null, paid: false, amountRub: 0 }

    const data = await callAcquiring('GetState', { PaymentId: String(bill.tinkoff.paymentId) })
    const amountRub = data.Amount != null ? Number(data.Amount) / 100 : 0
    const confirmed = data.Status === 'CONFIRMED'

    const update = { 'tinkoff.status': data.Status }
    if (confirmed && kind !== 'excursion') update['payment.amount'] = amountRub
    if (confirmed && kind === 'excursion') update.needPay = false
    await modelFor(kind).findByIdAndUpdate(billId, { $set: update })

    return { status: data.Status, paid: confirmed, amountRub }
}

/**
 * Возврат: полный или частичный. При частичном банк требует чек возврата,
 * его состав собирает менеджер в кабинете — маршрут закрыт ролью менеджера.
 */
async function cancelPayment({ billId, kind, amountRub, receipt }) {
    const bill = await modelFor(kind).findById(billId)
    if (!bill) fail('Счёт не найден', 404)
    if (!bill.tinkoff?.paymentId) fail('По счёту нет платежа в банке')

    const fields = { PaymentId: String(bill.tinkoff.paymentId) }
    if (amountRub != null) fields.Amount = toKopecks(amountRub)

    const nested = {}
    if (receipt?.Items?.length) {
        nested.Receipt = {
            Taxation: receipt.Taxation || 'usn_income',
            FfdVersion: receipt.FfdVersion || '1.05',
            Items: receipt.Items,
            ...(receipt.Email ? { Email: receipt.Email } : {}),
        }
    }

    const data = await callAcquiring('Cancel', fields, nested)
    await modelFor(kind).findByIdAndUpdate(billId, { $set: { 'tinkoff.status': data.Status } })

    return { status: data.Status, originalAmountRub: Number(data.OriginalAmount || 0) / 100 }
}

module.exports = {
    initTripPayment,
    initExcursionPayment,
    getPaymentState,
    cancelPayment,
    // используются в тестах и в расчёте кнопок кабинета
    billTotalRub,
    remainingPaymentRub,
    isTwoStagePayment,
}
