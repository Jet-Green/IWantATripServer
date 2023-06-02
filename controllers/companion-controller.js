const СompanionService = require('../service/companion-service')
const LocationService = require('../service/location-service')

module.exports = {
    async getAll(req, res, next) {
        try {
            let q = req.query
            return res.json(await СompanionService.findMany(q.lon, q.lat))
        } catch (error) {
            next(error)
        }
    },
    async search(req, res, next) {
        try {
            let s = req.body
            return res.json(await СompanionService.findForSearch(s))
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
            let location = await LocationService.createLocation(req.body.startLocation)
            req.body.startLocation = location
            const companionCb = await СompanionService.insertOne(req.body)

            return res.json({ _id: companionCb._id })
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
    async clear(req, res, next) {
        try {
            СompanionService.deleteMany()
        } catch (error) {
            next(error)
        }
    },

}