const СompanionService = require('../service/companion-service')
const LocationService = require('../service/location-service')

const AppStateModel = require('../models/app-state-model')

const { sendMail } = require('../middleware/mailer')

module.exports = {
    async getAll(req, res, next) {
        try {
            let q = req.query
            return res.json(await СompanionService.findMany(q.lon, q.lat, req.body))
        } catch (error) {
            next(error)
        }
    },
    async getById(req, res, next) {
        try {
            const _id = req.query._id
            return res.json(await СompanionService.findById(_id));
        } catch (error) {
            next(error)
        }
    },
    async create(req, res, next) {
        try {
            let location = await LocationService.createLocation(req.body.companion.startLocation)
            req.body.companion.startLocation = location
            const companionCb = await СompanionService.insertOne(req.body.companion)

            let eventEmails = await AppStateModel.findOne({ 'sendMailsTo.type': 'CreateCompanion' }, { 'sendMailsTo.$': 1 })
            let emailsFromDb = eventEmails.sendMailsTo[0].emails

            sendMail(req.body.emailHtml, emailsFromDb, 'Создан попутчик')

            return res.json({ _id: companionCb._id })
        } catch (error) {
            next(error)
        }
    },
    async deleteById(req, res, next) {
        try {
            return res.json(await СompanionService.deleteById(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async addFeedback(req, res, next) {
        try {
            return res.json(await СompanionService.addFeedback(req.body, req.query.companion_id))
        } catch (error) {
            next(error)
        }
    },
    async getCompanionsOnModeration(req, res, next) {
        try {
            return res.json(await СompanionService.getCompanionsOnModeration())
        } catch (error) {
            next(error)
        }
    },
    async acceptCompanion(req, res, next) {
        try {
            return res.json(await СompanionService.acceptCompanion(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async clear(req, res, next) {
        try {
            СompanionService.deleteMany()
        } catch (error) {
            next(error)
        }
    },
}