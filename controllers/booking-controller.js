const BookingService = require('../service/booking-service')


module.exports = {
    async create(req, res, next) {
        try {
            const bookingCb = await BookingService.insertOne(req.body)
            return res.json({ _id: bookingCb._id })
        } catch (err) {
            next(err)
        }
    },
    async findByUserId(req, res, next) {
        try {
            return res.json(await BookingService.findByUserId(req.body._id))
        } catch (error) {
            next(error)
        }
    },
    async getByStatus(req, res, next) {
        try {
            return res.json(await BookingService.getByStatus(req.query.status))
        } catch (error) {
            next(error)
        }
    }
}