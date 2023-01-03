const BookingModel = require('../models/booking-model');

module.exports = {
    insertOne(booking) {
        return BookingModel.create(booking)
    },
}