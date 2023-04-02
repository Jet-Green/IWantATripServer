const BookingModel = require('../models/booking-model');

module.exports = {
    insertOne(booking) {
        return BookingModel.create(booking)
    },
    findByUserId(_id) {
        return BookingModel.find({ creatorId: _id })
    },
}