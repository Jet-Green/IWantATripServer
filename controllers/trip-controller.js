const TripService = require('../service/trips-service.js')
const LocationService = require('../service/location-service.js')
const TripModel = require('../models/trip-model.js');
const AppStateModel = require('../models/app-state-model.js')

const ApiError = require('../exceptions/api-error.js')

let EasyYandexS3 = require('easy-yandex-s3').default;
const { sendMail } = require('../middleware/mailer')
const logger = require('../logger.js')

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
    async createManyByDates(req, res, next) {
        try {
            return res.json(await TripService.createManyByDates(req.body))
        } catch (error) {
            next(error)
        }
    },
    async setPayment(req, res, next) {
        try {
            return res.json(await TripService.setPayment(req.body))
        } catch (error) {
            next(error)
        }
    },
    async deletePayment(req, res, next) {
        try {
            return res.json(await TripService.deletePayment(req.query._id))
        } catch (error) {
            next(error)
        }
    },

    async getFullTripById(req, res, next) {
        try {
            return res.json(await TripService.getFullTripById(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async getCustomers(req, res, next) {
        try {
            return res.json(await TripService.getCustomers(req.body))
        } catch (error) {
            next(error)
        }
    },
    async getAll(req, res, next) {
        try {
            const q = req.query
            return res.json(await TripService.findMany(q.cursor, q.lon, q.lat, q.query, q.start, q.end, q.type))
        } catch (error) {
            next(error)
        }
    },
    async buyTrip(req, res, next) {
        try {
            let tripFromDb = await TripModel.findById(req.query._id).populate('author', { email: 1 }).populate('billsList')

            if (tripFromDb.parent) {
                await tripFromDb.populate('parent', { maxPeople: 1 })
                tripFromDb.maxPeople = tripFromDb.parent.maxPeople
            }

            let countToBuy = 0
            for (let cartItem of req.body.bill.cart) {
                countToBuy += cartItem.count
            }

            let boughtCount = 0
            for (let billFromDb of tripFromDb.billsList) {
                for (let cartItem of billFromDb.cart) {
                    boughtCount += cartItem.count
                }
            }
            if (boughtCount + countToBuy > tripFromDb.maxPeople) {
                throw ApiError.BadRequest('Слишком много человек в туре')
            }

            let eventEmailsBuy = await AppStateModel.findOne({ 'sendMailsTo.type': 'BuyTrip' }, { 'sendMailsTo.$': 1 })
            let emailsFromDbBuy = eventEmailsBuy.sendMailsTo[0]?.emails

            sendMail(req.body.emailHtml, [tripFromDb?.author?.email, ...emailsFromDbBuy], 'Куплена поездка')

            let buyCallBack = await TripService.buyTrip(req)

            logger.info({ _id: tripFromDb._id, billId: buyCallBack.billId, logType: 'trip' }, 'trip purchased')

            return res.json(buyCallBack.userCallback)
        } catch (error) {
            next(error)
        }
    },
    async search(req, res, next) {
        try {
            let s = req.body
            return res.json(await TripService.findForSearch(s, req.query.cursor))
        } catch (error) {
            next(error)
        }
    },
    async getById(req, res, next) {
        try {
            const _id = req.query._id
            return res.json(await TripService.findById(_id));
        } catch (error) {
            next(error)
        }
    },
    async deleteById(req, res, next) {
        try {
            const _id = req.body._id
            let removeTripCallback = await TripService.deleteOne(_id, s3)

            logger.info({ _id: removeTripCallback._id, logType: 'trip' }, 'trip deleted')

            return res.json(removeTripCallback);
        } catch (error) {
            next(error)
        }
    },
    async clear(req, res, next) {
        try {
            TripService.deleteMany()
        } catch (error) {
            next(error)
        }
    },
    async create(req, res, next) {
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

            const tripFromDB = await TripService.insertOne(req.body.trip)

            logger.info({ _id: tripFromDB._id.toString(), logType: 'trip' }, 'trip created')

            let trip = Object.assign({}, tripFromDB._doc)

            // format to send the mail
            trip.start = new Date(Number(trip.start)).toLocaleDateString("ru-RU")
            trip.end = new Date(Number(trip.end)).toLocaleDateString("ru-RU")

            let eventEmailsBook = await AppStateModel.findOne({ 'sendMailsTo.type': 'CreateTrip' }, { 'sendMailsTo.$': 1 })
            let emailsFromDbBook = eventEmailsBook.sendMailsTo[0].emails

            // req.body.emails - это емейл пользователя
            sendMail(req.body.emailHtml, [...req.body.emails, ...emailsFromDbBook], 'Создан тур')
            return res.json({ _id: trip._id })
        } catch (error) {
            next(error)
        }
    },
    async booking(req, res, next) {
        try {
            const tripCb = await TripService.booking(req.body)

            return res.json({ _id: tripCb._id })
        } catch (error) {
            next(error)
        }
    },
    async update(req, res, next) {
        try {
            const tripCb = await TripService.updateOne(req.body)

            logger.info({ _id: tripCb._id, logType: 'trip' }, 'trip edited and sent to moderation')

            return res.json({ _id: tripCb._id })
        } catch (error) {
            next(error)
        }
    },
    async hideTrip(req, res, next) {
        try {
            await TripService.hide(req.query._id, req.query.v)

            logger.info({ _id: req.query._id, isHidden: Boolean(req.query.v), logType: 'trip' }, 'trip hide')

            return res.json('OK')
        } catch (error) {
            next(error)
        }
    },
    async uploadImages(req, res, next) {
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
            if (filenames.length)
                await TripService.updateTripImagesUrls(_id, filenames)

            res.status(200).send('Ok')
        } catch (error) {
            next(error)
        }
    },
    async uploadPdf(req, res, next) {
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
            if (filenames.length)
                await TripService.updateTripImagesUrls(_id, filenames)

            res.status(200).send('Ok')
        } catch (error) {
            next(error)
        }
    },
    async createdTripsInfo(req, res, next) {
        try {
            return res.json(await TripService.createdTripsInfo(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async updateBillsTourists(req, res, next) {
        try {
            return res.json(await TripService.updateBillsTourists(req.body))
        } catch (error) {
            next(error)
        }
    },
    async updatePartner(req, res, next) {
        try {
            return res.json(await TripService.updatePartner(req.body))
        } catch (error) {
            next(error)
        }
    },
    async updateIncludedLocations(req, res, next) {
        try {
            return res.json(await TripService.updateIncludedLocations(req.body))
        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    async updateTransports(req, res, next) {
        try {
            return res.json(await TripService.updateTransports(req.body))
        } catch (error) {
            console.log(error);
            next(error)
        }
    }
}