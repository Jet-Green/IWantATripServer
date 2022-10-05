const { Schema, model } = require('mongoose')

const TripSchema = new Schema({
    name: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    duration: { type: Number, required: true },
    images: { type: Array, required: true },
    tripRoute: { type: String, required: true },
    distance: { type: String, required: true },
    cost: { type: Array, required: true },
    offer: { type: String, required: true },
    description: { type: String, required: true },
    location: { type: String, required: true },
    tripType: { type: String, required: true },
    fromAge: { type: String, required: true },
    period: { type: String, required: true },
})

module.exports = model('Trip', TripSchema);