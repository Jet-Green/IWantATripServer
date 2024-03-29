const { Schema, model } = require('mongoose')

const BookingSchema = new Schema({

    type: { type: Array },
    start: { type: Number },
    end: { type: Number },
    location: { type: String },
    duration: { type: String },
    adults: { type: Number },
    children: { type: Number },
    fromAge: { type: Number },
    wishes: { type: String },
    creatorId: { type: Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, default: 'open' },
    dateOfBooking: { type: Number },
    comment: { type: String, default: '' },

    offers: {
        type: [{
            offerText: { type: String },
            date: { type: Number },
            offerer: {
                type: Schema.Types.ObjectId,
                ref: 'Contract',
            },
            accepted: { type: Boolean, default: false },
            rejected: { type: Boolean, default: false },
            client: { type: Object, default: {} }
        }],
        _id: { id: true },
        default: []
    }
})

module.exports = model('Booking', BookingSchema);