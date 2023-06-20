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
    },
    async changeStatus(req, res, next) {
        try {
            return res.json(await BookingService.changeStatus(req.query._id, req.query.status))
        } catch (error) {
            next(error)
        }
    },
    async updateBooking(req, res, next) {
        try {
            return res.json(await BookingService.updateBooking(req.body))
        } catch (error) {
            next(error)
        }
    }
}