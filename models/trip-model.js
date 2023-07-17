const { Schema, model } = require('mongoose')

const TripSchema = new Schema({
    name: { type: String },
    start: { type: Number },
    end: { type: Number },
    maxPeople: { type: Number },
    duration: { type: String },
    images: { type: Array },
    pdfs: { type: Array },
    tripRoute: { type: String },
    distance: { type: String },
    cost: { type: Array },
    offer: { type: String },
    description: { type: String },
    startLocation: { type: Object },
    tripType: { type: String },
    fromAge: { type: String },
    // меняет только пользователь
    isHidden: { type: Boolean, default: false },
    // меняет модератор
    isModerated: { type: Boolean, default: false },
    billsList: { type: [Schema.Types.ObjectId], ref: 'Bill' },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    bonuses: Array,

    moderationMessage: { type: String, },

    children: { type: [Schema.Types.ObjectId], ref: 'Trip' },
    parent: { type: Schema.Types.ObjectId, ref: 'Trip' },
})

module.exports = model('Trip', TripSchema);
