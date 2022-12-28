const BookingModel = require('../models/booking-model.js');

export default {

    async createBookingElement(element) {
        return BookingModel.create(element)
    },
}