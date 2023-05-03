const { Schema, model } = require('mongoose')

const TripSchema = new Schema({
    name: { type: String },
    start: { type: Number },
    end: { type: Number },
    maxPeople: { type: Number },
    duration: { type: Number },
    images: { type: Array },
    pdfs: { type: Array },
    tripRoute: { type: String },
    distance: { type: String },
    cost: { type: Array },
    offer: { type: String },
    description: { type: String },
    startLocation: { type: Object },
    location: { type: String },
    tripType: { type: String },
    fromAge: { type: String },
    // меняет только пользователь
    isHidden: { type: Boolean, default: false },
    // меняет модератор
    isModerated: { type: Boolean, default: false },
    billsList: { type: Array, default: [] },
    creatorForm:{ type:Array }
})

module.exports = model('Trip', TripSchema);