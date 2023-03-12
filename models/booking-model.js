const { Schema, model } = require('mongoose')

const BookingSchema = new Schema({
    duration: { type: String },
    name: { type: String },
    delivery: { type: Boolean },
    type: { type: Array },
    start: { type: Number },
    end: { type: Number },
    resource: { type: String },
    desc: { type: String },
    fromAge: { type: String },
    phoneNumber: { type: String },
    tripType: { type: String },
})

module.exports = model('Booking', BookingSchema);