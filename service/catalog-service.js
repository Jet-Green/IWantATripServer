const CatalogTripModel = require('../models/catalog-trip-model.js');
const TripModel = require('../models/trip-model.js')
const PhotobankPhoto = require('../models/photobank-photo-model')

const ApiError = require('../exceptions/api-error.js')
const multer = require('../middleware/multer-middleware')

// Учёт использования фото из фотобанка (публикация/счётчики использования)
const {
    PUBLIC_PHOTOBANK_FILTER,
    incrementPhotobankUsage,
    decrementPhotobankUsage,
    syncPhotobankUsageDiff,
} = require('./photos-service')

const { sendMail } = require('../middleware/mailer');

const LocationService = require('./location-service.js')

const _ = require('lodash');
const sanitizeHtml = require('sanitize-html');
function sanitize(input) {
    return sanitizeHtml(input, {
        allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br'],
        allowedAttributes: {
            'a': ['href', 'target', 'rel'], // Разрешаем только ссылки и их атрибуты
            'img': ['src', 'alt', 'title', 'width', 'height'] // Разрешаем изображения и их атрибуты
        },
        allowedSchemes: ['http', 'https', 'data'], // Запрещаем потенциально опасные схемы (например, javascript:)
        allowedSchemesByTag: {
            img: ['http', 'https', 'data'] // Специально для тегов <img>
        },
        // Предотвращаем JavaScript-инъекции
        enforceHtmlBoundary: true
    })
}

module.exports = {
    async getFullCatalogById(_id) {
        let trip = await CatalogTripModel.findById(_id)
        return trip
    },
    async updateCatalogTripImagesUrls(_id, filenames) {
        const result = await CatalogTripModel.updateOne(
            { _id: _id },
            { $set: { images: filenames } }
        );
        return result;
    },
    async deleteOneCatalog(_id) {
        try {
            const deletedCatalog = await CatalogTripModel.findByIdAndDelete(_id)
            if (!deletedCatalog) {
                return { success: false, message: 'Каталог не найден' }
            }
            // Уменьшаем счётчики использования фотобанка: прямые ссылки в images
            // и использованные (обрезанные) фото из фотобанка
            await decrementPhotobankUsage([
                ...(deletedCatalog.images || []),
                ...(deletedCatalog.usedPhotobankUrls || []),
            ])
            return { success: true, data: deletedCatalog }
        } catch (error) {
            console.error('Ошибка при удалении каталога:', error)
            return { success: false, message: 'Ошибка при удалении', error }
        }
    },

    /**
     * Добавить к каталожному туру готовые URL из фотобанка (должны существовать
     * в коллекции photobankphotos и быть опубликованы). Проверяется автор.
     * @param {string} catalogTripId
     * @param {string[]} urls
     * @param {string} userId
     */
    async pushPhotobankImageUrlsIfOwned(catalogTripId, urls, userId) {
        // Нормализуем и дедуплицируем входящие URL
        const uniq = [
            ...new Set(
                (urls || [])
                    .filter((u) => typeof u === 'string')
                    .map((u) => u.trim())
                    .filter(Boolean)
            ),
        ];
        if (!uniq.length) {
            return { count: 0 };
        }

        // Все переданные URL должны быть опубликованными фото из фотобанка
        const n = await PhotobankPhoto.countDocuments({
            $and: [PUBLIC_PHOTOBANK_FILTER, { url: { $in: uniq } }],
        });
        if (n !== uniq.length) {
            const err = new Error(
                'Можно использовать только опубликованные фото из фотобанка'
            );
            err.statusCode = 400;
            throw err;
        }

        // Проверяем существование каталожного тура и права автора
        const catalogTrip = await CatalogTripModel.findById(catalogTripId).select('author images').lean();
        if (!catalogTrip) {
            const err = new Error('Тур не найден');
            err.statusCode = 404;
            throw err;
        }
        if (String(catalogTrip.author) !== String(userId)) {
            const err = new Error('Нет прав на редактирование');
            err.statusCode = 403;
            throw err;
        }

        // Вычисляем реально новые URL (которых ещё нет в изображениях каталога)
        const existing = new Set((catalogTrip.images || []).map(String));
        const newUrls = uniq.filter((u) => !existing.has(u));

        // Дедуплицирующее добавление в массив images
        if (newUrls.length) {
            await CatalogTripModel.updateOne(
                { _id: catalogTripId },
                { $push: { images: { $each: newUrls } } }
            );
            await incrementPhotobankUsage(newUrls);
        }
        return { count: uniq.length };
    },

    /**
     * Отмечает фото из фотобанка как использованные в каталожном туре (usageCount++),
     * НЕ добавляя URL в images (в тур попадает обрезанная копия как обычное изображение).
     */
    async markPhotobankUsedIfOwned(catalogTripId, urls, userId) {
        const uniq = [
            ...new Set(
                (urls || [])
                    .filter((u) => typeof u === 'string')
                    .map((u) => u.trim())
                    .filter(Boolean)
            ),
        ];
        if (!uniq.length) {
            return { count: 0 };
        }

        const n = await PhotobankPhoto.countDocuments({
            $and: [PUBLIC_PHOTOBANK_FILTER, { url: { $in: uniq } }],
        });
        if (n !== uniq.length) {
            const err = new Error(
                'Можно использовать только опубликованные фото из фотобанка'
            );
            err.statusCode = 400;
            throw err;
        }

        const catalogTrip = await CatalogTripModel.findById(catalogTripId)
            .select('author usedPhotobankUrls')
            .lean();
        if (!catalogTrip) {
            const err = new Error('Тур не найден');
            err.statusCode = 404;
            throw err;
        }
        if (String(catalogTrip.author) !== String(userId)) {
            const err = new Error('Нет прав на редактирование');
            err.statusCode = 403;
            throw err;
        }

        const existing = new Set((catalogTrip.usedPhotobankUrls || []).map(String));
        const newUrls = uniq.filter((u) => !existing.has(u));
        if (newUrls.length) {
            await CatalogTripModel.updateOne(
                { _id: catalogTripId },
                { $addToSet: { usedPhotobankUrls: { $each: newUrls } } }
            );
            await incrementPhotobankUsage(newUrls);
        }
        return { count: newUrls.length };
    },
    async hideCatalog(_id, v) {
        return CatalogTripModel.findByIdAndUpdate(_id, { isHidden: v })
    },
    async editCatalogTrip(data) {
        const { _id, trip } = data;
        const { startLocation } = trip
        if (startLocation && startLocation.coordinates) {
            startLocation.coordinates = startLocation.coordinates.map(coord => parseFloat(coord));
        }
        trip.description = sanitize(trip.description)
        let location = await LocationService.createLocation(startLocation)

        // Синхронизируем счётчики использования фотобанка при изменении images
        if (trip.images !== undefined) {
            const prev = await CatalogTripModel.findById(_id).select('images').lean()
            await syncPhotobankUsageDiff(prev?.images || [], trip.images || [])
        }

        return CatalogTripModel.findByIdAndUpdate(
            _id,
            {
                $set: {
                    name: trip.name,
                    duration: trip.duration,
                    tripRoute: trip.tripRoute,
                    offer: trip.tripOffer,
                    description: trip.description,
                    rejected: trip.rejected,
                    tripType: trip.tripType,
                    fromAge: trip.fromAge,
                    isHidden: trip.isHidden,
                    isModerated: trip.isModerated,
                    author: trip.author,
                    moderationMessage: trip.moderationMessage,
                    "startLocation._id": location._id,
                    "startLocation.name": location.name,
                    "startLocation.shortName": location.shortName,
                    "startLocation.type": location.type,
                    "startLocation.coordinates": location.coordinates,
                    ...(trip.images !== undefined ? { images: trip.images } : {})
                }
            },
            { new: true, runValidators: true } // Включаем валидацию и возвращаем новый документ
        );
    },
    async findCatalogTripsOnModeration() {
        return CatalogTripModel.find({
            $and: [{ isModerated: false },
            { rejected: false },
            { "parent": { $exists: false } }
            ]
        }).populate('author', { 'fullinfo.fullname': 1, 'fullinfo.phone': 1 }).sort({ 'createdDay': -1 })
    },
    async findRejectedCatalogTrips() {
        return CatalogTripModel.find({
            $and: [{ rejected: true },
            { "parent": { $exists: false } }
            ]
        }).populate('author', { 'fullinfo.fullname': 1, 'fullinfo.phone': 1 })
    },

    async getCatalogTrips(sitePage, lon, lat, strQuery, tripType) {
        const limit = 20;
        const page = sitePage || 1;
        const skip = (page - 1) * limit;
        let query = {}

        query = {
            $and: [

                { isHidden: false, rejected: false },
                { "parent": { $exists: false } },
            ]
        }

        if (lat && lon) {
            query.$and.push({
                startLocation: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [Number(lon), Number(lat)]
                        },
                        // 50 km
                        $maxDistance: 50000
                    }
                }
            })
        }

        if (strQuery) {
            query.$and.push({
                $or: [
                    { name: { $regex: strQuery, $options: 'i' } },
                    { tripRoute: { $regex: strQuery, $options: 'i' } },
                    { offer: { $regex: strQuery, $options: 'i' } },
                    { description: { $regex: strQuery, $options: 'i' } },
                ]
            })
        }
        if (tripType) {
            query.$and.push({

                tripType: { $regex: tripType, $options: 'i' },

            })
        }

        const cursor = CatalogTripModel.find(query, null, { sort: 'start' }).skip(skip).limit(limit).cursor();
        const results = [];
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            results.push(doc);
        }
        return results
    },
    async moderateCatalog(_id, t) {

        return CatalogTripModel.findByIdAndUpdate(_id, { isModerated: t, rejected: false })
    },
    async sendCatalogModerationMessage(tripId, msg) {
        return CatalogTripModel.findByIdAndUpdate(tripId, { isModerated: false, moderationMessage: msg, rejected: true })
    },
    async getCatalogTripById(_id) {
        return await CatalogTripModel.findById(_id).populate({
            path: 'author',
            select: {
                fullinfo: 1
            }
        })
    },
    async moveToCatalog(_id) {
        let candidate = await TripModel.findById(_id)
        delete candidate._doc._id
        delete candidate._doc.isModerated
        delete candidate._doc.rejected
        let toSave = Object.assign({}, candidate._doc)

        return CatalogTripModel.create(toSave)
    },
    async getMyCatalogTrips(id) {
        return await CatalogTripModel.find({ author: id, isModerated: true, rejected: false })
    },
    async myCatalogOnModeration(id) {
        return await CatalogTripModel.find({ author: id, isModerated: false })
    }
}