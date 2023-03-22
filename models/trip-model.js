const { Schema, model } = require('mongoose')

const TripSchema = new Schema({
    name: { type: String },
    start: { type: Number },
    end: { type: Number },
    maxPeople: { type: Number },
    duration: { type: Number },
    images: { type: Array },
    tripRoute: { type: String },
    distance: { type: String },
    cost: { type: Array },
    offer: { type: String },
    description: { type: String },
    startLocation: { type:String},
    location: { type: String },
    tripType: { type: String },
    fromAge: { type: String },
    // меняет только пользователь
    isHidden: { type: Boolean, default: false },
    // меняет модератор
    isModerated: { type: Boolean, default: true },
    billsList: { type: Array, default: [] },
    creatorId:{ type:String }
})

module.exports = model('Trip', TripSchema);