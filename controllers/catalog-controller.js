const LocationService = require('../service/location-service.js')
const CatalogService = require('../service/catalog-service.js')

const ApiError = require('../exceptions/api-error.js')

let EasyYandexS3 = require('easy-yandex-s3').default;
const logger = require('../logger.js');
const catalogTripModel = require('../models/catalog-trip-model.js');
const { default: mongoose } = require('mongoose');

// Указываем аутентификацию в Yandex Object Storage
let s3 = new EasyYandexS3({
    auth: {
        accessKeyId: process.env.YC_KEY_ID,
        secretAccessKey: process.env.YC_SECRET,
    },
    Bucket: process.env.YC_BUCKET_NAME, // Название бакета
    debug: false, // Дебаг в консоли
});

module.exports = {
    async getFullCatalogById(req, res, next) {
        try {
            return res.json(await CatalogService.getFullCatalogById(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async getCatalog(req, res, next) {
        try {
            const q = req.query
            return res.json(await CatalogService.getCatalogTrips(q.cursor, q.lon, q.lat, q.query, q.type))
        } catch (error) {
            next(error)
        }
    },
    async deleteCatalogById(req, res, next) {
        try {
            const _id = req.body._id
            let removeCatalogTripCallback = await CatalogService.deleteOneCatalog(_id, s3)

            logger.info({ _id: removeCatalogTripCallback._id, logType: 'catalog' }, 'catalog trip deleted')

            return res.json(removeCatalogTripCallback);
        } catch (error) {
            next(error)
        }
    },
    async createCatalogTrip(req, res, next) {
        try {
            let location = await LocationService.createLocation(req.body.trip.startLocation)

            // if (!req.body.trip.includedLocations?.coordinates > 1) {
            req.body.trip.startLocation = location
            req.body.trip.includedLocations = {
                'type': 'MultiPoint',
                coordinates: [location.coordinates],
            }
            req.body.trip.locationNames = [location]
            // }

            const tripFromDB = await catalogTripModel.create(req.body.trip)

            logger.info({ _id: tripFromDB._id.toString(), logType: 'trip' }, 'trip created')

            let trip = Object.assign({}, tripFromDB._doc)

            // format to send the mail
            trip.start = new Date(Number(trip.start)).toLocaleDateString("ru-RU")
            trip.end = new Date(Number(trip.end)).toLocaleDateString("ru-RU")

            // let eventEmailsBook = await AppStateModel.findOne({ 'sendMailsTo.type': 'CreateTrip' }, { 'sendMailsTo.$': 1 })
            // let emailsFromDbBook = eventEmailsBook.sendMailsTo[0].emails

            // // req.body.emails - это емейл пользователя
            // sendMail(req.body.emailHtml, [...req.body.emails, ...emailsFromDbBook], 'Создан тур')
            return res.json({ _id: trip._id })
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'create' })
            next(error)
        }
    },
    async hideCatalogTrip(req, res, next) {
        try {
            await CatalogService.hideCatalog(req.query._id, req.query.v)
            return res.json('OK')
        } catch (error) {
            next(error)
        }
    },
    async uploadCatalogImages(req, res, next) {
        try {
            let _id = req.files[0]?.originalname.split('_')[0]
           
            let filenames = []
            let buffers = []
            for (let file of req.files) {
                buffers.push({ buffer: file.buffer, name: file.originalname, });    // Буфер загруженного файла
            }
       
            if (buffers.length) {
                let uploadResult = await s3.Upload(buffers, '/iwat/');

                for (let upl of uploadResult) {
                    filenames.push(upl.Location)
                }
               
            }

            if (filenames.length) {
                await CatalogService.updateCatalogTripImagesUrls(_id, filenames)
                logger.info({ filenames, logType: 'trip' }, 'catalog images uploaded')
            }

            return res.status(200).send('Ok')
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'uploadCatalogImages' })
            next(error)
        }
    },
    async updateCatalogTrip(req, res, next) {
        try {
            let trip = await catalogTripModel.findById(req.body._id)
            if (req.user._id != trip.author._id.toString())
                throw ApiError.BadRequest('Не ваш')
            return res.json(trip.updateOne(req.body.trip, { new: true }))
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'updateCatalogTrip' })
            next(error)
        }
    },

    async editCatalogTrip(req, res, next) {
        try {
            const tripCb = await CatalogService.editCatalogTrip(req.body)
            logger.info({ _id: tripCb._id, logType: 'trip' }, 'Catalogtrip edited and sent to moderation')
            return res.json({ _id: tripCb._id })
        }
        catch (error) {
            logger.fatal({ error, logType: 'catalogTrip error', brokenMethod: 'editCatalogTrip' })
            next(error)
        }
    },
    /** 
    * req.body {
    *   newTransport
    *   transportToDelete
    *   tripId
    * }
    */
    async getMyCatalogTrips(req, res, next) {
        try {

            return res.json(await CatalogService.getMyCatalogTrips(req.body.id))
        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    async getCatalogTrips(req, res, next) {
        try {
            return res.json(await CatalogService.getCatalogTrips())
        } catch (error) {
            next(error)
        }
    },
    /*
    * req.body {
    *   tripId
    *   comment
    * }
    */
    async getCatalogTripById(req, res, next) {
        try {
            return res.json(await CatalogService.getCatalogTripById(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async moveToCatalog(req, res, next) {
        try {
            return res.json(await CatalogService.moveToCatalog(req.body.tripId))
        } catch (error) {
            next(error)
        }
    },
    /**
    * req.body {
    *  catalogTrips: array of CatalogTrip ids
    * }
    */
    async myCatalogOnModeration(req, res, next) {
        try {
            return res.json(await CatalogService.myCatalogOnModeration(req.body.id))
        } catch (error) {
            next(error)
        }
    },
}