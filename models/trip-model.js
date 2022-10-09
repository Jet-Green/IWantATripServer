const { Schema, model } = require('mongoose')

const TripSchema = new Schema({
    name: { type: String },
    start: { type: String },
    end: { type: String },
    duration: { type: Number },
    images: { type: Array },
    tripRoute: { type: String },
    distance: { type: String },
    cost: { type: Array },
    offer: { type: String },
    description: { type: String },
    location: { type: String },
    tripType: { type: String },
    fromAge: { type: String },
    period: { type: String },
})

module.exports = model('Trip', TripSchema);