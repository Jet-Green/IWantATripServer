const BookingService = require('../service/booking-service')


module.exports = {
    async create(req, res, next) {
        try {
            const bookingCb = await BookingService.insertOne(req.body)
            sendMail(trip, 'booking-trip.hbs', req.body.emails)
            return res.json({ _id: bookingCb._id })
        } catch (err) {
            console.log(err);

        }
    },
    async findByUserId(req, res, next) {
        try {

            return res.json(await BookingService.findByUserId(req.body._id))
        } catch (error) {
            next(error)
        }
    },
}