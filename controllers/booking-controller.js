const BookingService = require('../service/booking-service')


module.exports = {
    async create(req, res, next) {
        try {
            const bookingCb = await BookingService.insertOne(req.body)
            console.log(req.body, req)

            return res.json({ _id: bookingCb._id })

        } catch (err) {
            console.log(err);

        }
    },
}