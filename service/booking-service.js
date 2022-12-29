const BookingModel = require('../models/booking-model.js');

module.exports = {
    async createBookingElement(element) {
        return BookingModel.create(element)
    },
}