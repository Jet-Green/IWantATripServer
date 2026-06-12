const CyrillicToTranslit = require('cyrillic-to-translit-js')
const TripModel = require('../models/trip-model.js')

const translit = new CyrillicToTranslit()

// «Тур на Кавказ» -> «tur-na-kavkaz»
function baseSlug(name) {
    return translit
        .transform((name || '').trim(), '-')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '') || 'tur'
}

// Уникализация числовым суффиксом: tur-na-kavkaz, tur-na-kavkaz-2, ...
async function generateUniqueSlug(name, excludeId = null) {
    const base = baseSlug(name)
    let slug = base
    let n = 2
    const buildQuery = (s) => (excludeId ? { slug: s, _id: { $ne: excludeId } } : { slug: s })
    while (await TripModel.exists(buildQuery(slug))) {
        slug = `${base}-${n++}`
    }
    return slug
}

module.exports = { baseSlug, generateUniqueSlug }
