const СompanionService = require('../service/companion-service')

module.exports = {
    async getAll(req, res, next) {
        try {
            return res.json(await СompanionService.findMany())
        } catch (error) {
            next(error)
        }
    },
    async create(req, res, next) {
        try {
            const companionCb = await СompanionService.insertOne(req.body)
            return res.json({ _id: companionCb._id })
        } catch (error) {
            next(error)
        }
    },

}