const СompanionService = require('../service/companion-service')

module.exports = {
    async getAll(req, res, next) {
        try {
            return res.json(await СompanionService.findMany())
        } catch (error) {
            next(error)
        }
    },
    async getById(req, res, next) {
        try {
            const _id = req.query._id
            return res.json(await СompanionService.findById(_id));
        } catch (error) {
            console.log(error);
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