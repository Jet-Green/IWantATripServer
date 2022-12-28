const BookingService = require('../service/booking-service')




module.exports = {
async createBookingElement(req, res, next) {
    try {
        let bookingCb = await BookingService.createElement(req.body)
        console.log(req.body, req)
        // вызвать сервис, который будет сохранять в БД
        return res.json({ _id: bookingCb._id })
    } catch (err) {
        console.log(err);
        // when api error enabled
        // next(err)
    }
},
}