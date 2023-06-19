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
    }
}