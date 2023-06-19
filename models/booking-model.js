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

    comment: { type: String, default: '' }
})

module.exports = model('Booking', BookingSchema);