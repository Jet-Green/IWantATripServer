const TripService = require('../service/trips-service.js')
const LocationService = require('../service/location-service.js')
const PlaceService = require('../service/places-service.js')

const TripModel = require('../models/trip-model.js');
const AppStateModel = require('../models/app-state-model.js')
const UserModel = require('../models/user-model.js')

const ApiError = require('../exceptions/api-error.js')

const { sendMail } = require('../middleware/mailer')
const logger = require('../logger.js');
const { default: mongoose } = require('mongoose');
const s3 = require('../yandex-cloud.js')
const billModel = require('../models/bill-model.js');

const sanitizeHtml = require('sanitize-html');
function sanitize(input) {    return sanitizeHtml(input, {
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

// Указываем аутентификацию в Yandex Object Storage

module.exports = {
    async createManyByDates(req, res, next) {
        try {
            let createdIds = await TripService.createManyByDates(req.body)

            logger.info({ parentId: req.body.parentId, createdIds, logType: 'trip' }, 'many trips created by dates')

            return res.json(createdIds)
        } catch (error) {
            next(error)
        }
    },
    async setPayment(req, res, next) {
        try {
            let billFromDb = await TripService.setPayment(req.body)

            logger.info({ billId: billFromDb._id, doc: req.body.doc, logType: 'trip' }, 'set payment')

            return res.json(billFromDb)
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'setPayment' })
            next(error)
        }
    },
    async deletePayment(req, res, next) {
        try {
            logger.info({ billId: req.query._id, logType: 'trip' }, 'delete payment')

            return res.json(await TripService.deletePayment(req.query._id))
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'setPayment' })
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
            return res.json(await TripService.findMany(q.cursor, q.lon, q.lat, q.query, q.start, q.end, q.type, q.tripRegion, Number(q.locationRadius) * 1000, q.location))
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
            let userFromDb = await UserModel.findById(req.body.bill.userInfo._id)
            let eventEmailsBuy = await AppStateModel.findOne({ 'sendMailsTo.type': 'BuyTrip' }, { 'sendMailsTo.$': 1 })
            let emailsFromDbBuy = eventEmailsBuy.sendMailsTo[0]?.emails
            sendMail(req.body.emailHtmlForAdmins, [tripFromDb?.author?.email, ...emailsFromDbBuy], 'Куплена поездка')
            if (userFromDb)
                sendMail(req.body.emailHtmlForUser, [userFromDb.email], 'Куплена поездка')

            let buyCallBack = await TripService.buyTrip(req)

            logger.info({ _id: tripFromDb._id, billId: buyCallBack.billId, logType: 'trip' }, 'trip purchased')

            return res.json(buyCallBack.userCallback)
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'buyTrip' })
            next(error)
        }
    },
    async payTinkoffBill(req, res, next) {
        try {
            let eventEmailsBuy = await AppStateModel.findOne({ 'sendMailsTo.type': 'BuyTrip' }, { 'sendMailsTo.$': 1 })
            let emailsFromDbBuy = eventEmailsBuy.sendMailsTo[0]?.emails

            sendMail(req.body.emailHtml, [req.body.author, ...emailsFromDbBuy], 'Куплена поездка')

            return res.json(await TripService.payTinkoffBill(req.body))
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
            if (req.body.trip.startLocation && req.body.trip.startLocation!="")
            {
                let location = await LocationService.createLocation(req.body.trip.startLocation)
                // if (!req.body.trip.includedLocations?.coordinates > 1) {
                req.body.trip.startLocation = location
                req.body.trip.includedLocations = {
                    'type': 'MultiPoint',
                    coordinates: [location.coordinates],
                }
                req.body.trip.locationNames = [location]
                // }
            }
            else{
                req.body.trip.startLocation = null
                req.body.trip.includedLocations = null
                req.body.trip.locationNames = null
            }

            req.body.trip.description=sanitize(req.body.trip.description)

            const tripFromDB = await TripService.insertOne(req.body.trip)

            logger.info({ _id: tripFromDB._id.toString(), logType: 'trip' }, 'trip created')

            let trip = Object.assign({}, tripFromDB._doc)

            // format to send the mail
            trip.start = new Date(Number(trip.start)).toLocaleDateString("ru-RU")
            trip.end = new Date(Number(trip.end)).toLocaleDateString("ru-RU")

            let eventEmailsBook = await AppStateModel.findOne({ 'sendMailsTo.type': 'CreateTrip' }, { 'sendMailsTo.$': 1 })
            let emailsFromDbBook = eventEmailsBook.sendMailsTo[0].emails

            if (tripFromDB.places?.length > 0) {
                await PlaceService.updateWithTrips(tripFromDB.places, tripFromDB._id)
            }

            // req.body.emails - это емейл пользователя
            sendMail(req.body.emailHtml, [...req.body.emails, ...emailsFromDbBook], 'Создан тур')
            return res.json({ _id: trip._id })
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'create' })
            next(error)
        }
    },
    async booking(req, res, next) {
        try {
            const tripCb = await TripService.booking(req.body)

            return res.json({ _id: tripCb._id })
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'booking' })
            next(error)
        }
    },
    async update(req, res, next) {
        try {
            const tripCb = await TripService.updateOne(req.body)

            await PlaceService.updateWithTrips(req.body.places, tripCb._id)

            logger.info({ _id: tripCb._id, logType: 'trip' }, 'trip edited and sent to moderation')

            return res.json({ _id: tripCb._id })
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'update' })
            next(error)
        }
    },
    async hideTrip(req, res, next) {
        try {
            await TripService.hide(req.query._id, req.query.v)
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

            if (filenames.length) {
                await TripService.updateTripImagesUrls(_id, filenames)
                logger.info({ filenames, logType: 'trip' }, 'images uploaded')
            }

            res.status(200).send('Ok')
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'uploadImages' })
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
            return res.json(await TripService.createdTripsInfo(req.body._id, req.body.query, req.body.page, req.body.isArchive))
        } catch (error) {
            next(error)
        }
    },
    async updateBillsTourists(req, res, next) {
        try {
            return res.json(await TripService.updateBillsTourists(req.body))
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'updateBillsTourists' })
            next(error)
        }
    },
    async updatePartner(req, res, next) {
        try {
            return res.json(await TripService.updatePartner(req.body))
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'updatePartner' })
            next(error)
        }
    },
    /*
    * req.body {
    *   newLocation
    *   locationsToDelete
    *   tripId
    * }
    */
    async updateIncludedLocations(req, res, next) {
        try {
            let updateCallback = await TripService.updateIncludedLocations(req.body)

            logger.info({ newLocation: req.body.newLocation, locationsToDelete: req.body.locationsToDelete, _id: req.body.tripId, logType: 'trip' }, 'trip locations updated')

            return res.json(updateCallback)
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'updateIncludedLocations' })
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
    async updateTransports(req, res, next) {
        try {
            let updateTransportsCallback = await TripService.updateTransports(req.body)
            // logger.info({ newTransport: req.body.newTransport, transportToDelete: req.body.transportToDelete, _id: req.body.tripId, logType: 'trip' }, 'trip transports updated')
            return res.json(updateTransportsCallback)
        } catch (error) {
            logger.fatal({ error, logType: 'trip error', brokenMethod: 'updateTransports' })
            next(error)
        }
    },
    async findTripsByName(req, res, next) {
        try {

            let tripsByName = await TripService.findTripsByName(req.body)
            return res.json(tripsByName)
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
    async setUserComment(req, res, next) {
        try {
            return res.json(await TripService.setUserComment(req.body))
        } catch (error) {
            next(error)
        }
    },
    /**
    * req.body {
    *   billId
    *   comment
    * }
    */
    async editBillUserComment(req, res, next) {
        try {
            return res.json(await TripService.editBillUserComment(req.body))
        } catch (error) {
            next(error)
        }
    },
    /**
     * req.query {
     *  userId
     * }
     */
    async getBoughtTrips(req, res, next) {
        try {
            return res.json(await TripService.getBoughtTrips(req.query.userId))
        } catch (err) {
            next(err)
        }
    },
    /**
    * req.body {
    *  catalogTrips: array of CatalogTrip ids
    * }
    */
    async myCatalogOnModeration(req, res, next) {
        try {
            return res.json(await TripService.myCatalogOnModeration(req.body.id))
        } catch (error) {
            next(error)
        }
    },
    async getBoughtSeats(req, res, next) {
        try {
            return res.json((await billModel.find({ tripId: mongoose.Types.ObjectId(req.query._id), seats: { $exists: true } }, { seats: 1, _id: 0 })).map(bill => bill.seats).flat())
        } catch (error) {
            next(error)
        }
    },
    async updateAllTripsWithShopCode() {
        try {
            await TripModel.updateMany({}, {
                $set: {
                    shopInfo: {
                        ShopCode: 1347849,
                        Name: "ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ \"ВЕАКОМ\"",
                        Inn: "1837013663",
                        Phones: ["89128523316"],
                    }
                }
            })
        } catch (error) {
            console.log(error);
        }
    },
    async addAdditionalService(req, res, next) {
        try {
            let { tripId, service } = req.body

            return res.json(await TripModel.findByIdAndUpdate(tripId, { $push: { additionalServices: service } }, { new: true }))
        } catch (error) {
            next(error)
        }
    },
    async deleteAdditionalService(req, res, next) {
        try {
            let { tripId, serviceId } = req.body

            let tripFromDb = await TripModel.findById(tripId)

            for (let i = 0; i < tripFromDb.additionalServices.length; i++) {
                if (tripFromDb.additionalServices[i]._id.toString() == serviceId) {
                    tripFromDb.additionalServices.splice(i, 1)
                    break;
                }
            }

            tripFromDb.markModified('additionalServices')
            return res.json(await tripFromDb.save())
        } catch (error) {
            next(error)
        }
    },
    async findAuthorTrips(req, res, next) {
        try {
            return res.json(await TripService.findAuthorTrips(req.body))
        } catch (error) {
            next(error)
        }
    },




}