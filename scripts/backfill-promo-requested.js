// Разовая миграция под разделение акции «оплата по СБП» на запрос и решение.
//
// Раньше поле privetMirYookassaEnabled ставил сам автор, и оно означало
// «автор включил акцию». Теперь оно означает «модератор разрешил», а желание
// автора живёт в privetMirYookassaRequested.
//
// Туры, у которых акция была включена до этой правки, считаем одобренными
// задним числом: иначе оплата по ним сломается. Проставляем им requested,
// чтобы автор видел в форме тот же чекбокс включённым.
//
// Запуск:  node scripts/backfill-promo-requested.js production

require('dotenv').config({ path: `${process.argv[2] || 'development'}.env` })

const mongoose = require('mongoose')
const TripModel = require('../models/trip-model.js')

;(async () => {
    await mongoose.connect(process.env.MONGO_URL)

    const filter = {
        privetMirYookassaEnabled: true,
        privetMirYookassaRequested: { $ne: true },
    }

    const affected = await TripModel.find(filter, { name: 1 }).lean()

    if (!affected.length) {
        console.log('Туров для миграции нет — все уже согласованы.')
        await mongoose.disconnect()
        return
    }

    console.log(`Найдено туров: ${affected.length}`)
    for (const trip of affected) {
        console.log(`  ${trip._id}  ${String(trip.name || '').slice(0, 60)}`)
    }

    // strict: false обязателен — скрипт может запускаться раньше выката кода,
    // когда схема на сервере ещё не знает нового поля. Без этого Mongoose
    // молча выбросит его из $set, и миграция отработает вхолостую.
    const result = await TripModel.updateMany(filter, {
        $set: { privetMirYookassaRequested: true },
    }, { strict: false })

    console.log(`Обновлено: ${result.modifiedCount}`)

    await mongoose.disconnect()
})().catch((error) => {
    console.error(error)
    process.exit(1)
})
