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
    async getOffersByBookingId(booking_id, status) {
        let bookingFromDb = await BookingModel.findById(booking_id, { offers: 1 }).populate({ path: 'offers.offerer', select: { name: 1 } })
        let offersToSend = []

        switch (status) {
            case 'new':
                for (let o of bookingFromDb.offers) {
                    if (o.accepted == false && o.rejected == false) {
                        offersToSend.push(o)
                    }
                }
                break
            case 'accepted':
                for (let o of bookingFromDb.offers) {
                    if (o.accepted == true && o.rejected == false) {
                        offersToSend.push(o)
                    }
                }
                break
            case 'rejected':
                for (let o of bookingFromDb.offers) {
                    if (o.accepted == false && o.rejected == true) {
                        offersToSend.push(o)
                    }
                }
                break
        }
        return offersToSend
    },
    async acceptOffer({ bookingId, offerId, client }) {
        return await BookingModel.findOneAndUpdate({ _id: bookingId, 'offers._id': offerId }, { $set: { "offers.$.client": client, "offers.$.accepted": true, "offers.$.rejected": false } })
    },
    async rejectOffer({ bookingId, offerId }) {
        return await BookingModel.findOneAndUpdate({ _id: bookingId, 'offers._id': offerId }, { $set: { "offers.$.client": {}, "offers.$.accepted": false, "offers.$.rejected": true } })
    },
    async toNewOffer({ bookingId, offerId }) {
        return await BookingModel.findOneAndUpdate({ _id: bookingId, 'offers._id': offerId }, { $set: { "offers.$.client": {}, "offers.$.accepted": false, "offers.$.rejected": false } })
    },
    async deleteOrder(_id) {
        return await BookingModel.findOneAndDelete({ _id: _id})
    }
}