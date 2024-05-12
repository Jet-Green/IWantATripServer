const { Schema, model } = require('mongoose')

const ExcursionBookingSchema = new Schema({
    time: { type: Schema.Types.ObjectId },
    excursion: { type: Schema.Types.ObjectId, ref: 'Excursion' },
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    count: { type: Number }
})
module.exports = model('ExcursionBooking', ExcursionBookingSchema);
