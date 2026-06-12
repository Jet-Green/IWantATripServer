// Разовая миграция: проставляет slug всем турам, у которых его ещё нет.
// Запуск:  node scripts/backfill-slugs.js development
require('dotenv').config({ path: `${process.argv[2] || 'development'}.env` })

const mongoose = require('mongoose')
const TripModel = require('../models/trip-model.js')
const { generateUniqueSlug } = require('../service/slug-util.js')

;(async () => {
    await mongoose.connect(process.env.MONGO_URL)

    const trips = await TripModel.find(
        { $or: [{ slug: { $exists: false } }, { slug: null }, { slug: '' }] },
        { name: 1 }
    )
    console.log(`Туров без slug: ${trips.length}`)

    let done = 0
    for (const t of trips) {
        const slug = await generateUniqueSlug(t.name, t._id)
        await TripModel.updateOne({ _id: t._id }, { $set: { slug } })
        done++
        if (done % 25 === 0) console.log(`...${done}/${trips.length}`)
    }

    console.log(`Готово. Обновлено: ${done}`)
    await mongoose.disconnect()
    process.exit(0)
})().catch((e) => {
    console.error(e)
    process.exit(1)
})
