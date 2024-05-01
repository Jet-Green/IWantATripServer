const ExcursionService = require('../service/excursion-service.js')

module.exports = {
    async create(req, res, next) {
        try {
            let callback = await ExcursionService.create(req.body)
            return res.json(callback)
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
    }
}