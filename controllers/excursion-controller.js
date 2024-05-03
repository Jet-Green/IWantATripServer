const ExcursionService = require('../service/excursion-service.js')
const LocationService = require('../service/location-service.js')

module.exports = {
    async create(req, res, next) {
        try {
            let location = await LocationService.createLocation(req.body.excursion.location)
            if (location?._id)
                req.body.excursion.location = location._id.toString()
            let callback = await ExcursionService.create(req.body)
            return res.json(callback)
        } catch (error) {
            next(error)
        }
    },
    async getById(req, res, next) {
        try {
            return res.json(await ExcursionService.getById(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async getUserExcursions(req, res, next) {
        try {
            return res.json(await ExcursionService.getByUserId(req.query.user_id))
        } catch (error) {
            next(error)
        }
    },
    /** 
     * dates are from datePlugin.excursions.concatDateAndTime
     * _id is excursion _id
    */
    async createDates(req, res, next) {
        try {
            return res.json(await ExcursionService.createDates(req.body))
        } catch (error) {
            next(error)
        }
    },
    async getAll(req, res, next) {
        try {
            return res.json(await ExcursionService.getAll())
        } catch (error) {
            next(error)
        }
    },
    async getDateById(req, res, next) {
        try {
            return res.json(await ExcursionService.getDateById(req.query._id))
        } catch (error) {
            next(error)
        }
    }
}