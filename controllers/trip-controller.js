const TripService = require('../service/trips-service.js')

module.exports = {
    async getAll(req, res, next) {
        try {
            return res.json(await TripService.findMany())
        } catch (err) {
            console.log(err);
            // when api error enabled
            // next(err)
        }
    },
    async getById(req, res, next) {
        try {
            const _id = req.query._id
            return res.json(await TripService.findById(_id));
        } catch (error) {
            console.log(error);
        }
    },
    async clear(req, res, next) {
        try {
            TripService.deleteMany()
        } catch (error) {
            console.log(error);
        }
    },
    async create(req, res, next) {
        try {
            TripService.insertOne(req.body)
        } catch (error) {
            console.log(error);
        }
    }
}