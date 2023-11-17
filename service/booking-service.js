const BookingModel = require('../models/booking-model');

module.exports = {
    insertOne(booking) {
        return BookingModel.create(booking)
    },
    findByUserId(_id) {
        return BookingModel.find({ creatorId: _id })
    },
    getByStatus(status) {
        return BookingModel.find({ status }).populate('creatorId', "fullinfo").
            exec();
    },
    changeStatus(_id, status) {
        return BookingModel.findByIdAndUpdate(_id, { status: status })
    },
    updateBooking(newBooking) {
        return BookingModel.findByIdAndUpdate(newBooking._id, newBooking)
    },
    offerTrip({ bookingId, offer }) {
        return BookingModel.findByIdAndUpdate(bookingId, { $push: { offers: offer } })
    },
    async getOffersByBookingId(booking_id) {
        let bookingFromDb = await BookingModel.findById(booking_id, { offers: 1 })

        return bookingFromDb.offers
    }
}