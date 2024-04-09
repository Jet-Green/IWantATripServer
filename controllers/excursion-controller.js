const ExcursionService = require('../service/excursion-service.js')

module.exports = {
    async create(req, res, next) {
        try {
            let callback = await ExcursionService.create(req.body)
            return res.json(callback)
        } catch (error) {
            next(error)
        }
    }
}