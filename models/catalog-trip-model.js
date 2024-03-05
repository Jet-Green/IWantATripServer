const { Schema, model } = require('mongoose')

const LocationModel = require('./location-model')

const LocationSchema = LocationModel.schema

const CatalogTripSchema = new Schema({
    name: { type: String },
    duration: { type: String },
    images: { type: Array },
    tripRoute: { type: String },
    offer: { type: String },
    description: { type: String },
    rejected: { type: Boolean, default: false },

    startLocation: { type: Object },

    tripType: { type: String },
    fromAge: { type: String },
    // меняет только пользователь
    isHidden: { type: Boolean, default: false },
    // меняет модератор
    isModerated: { type: Boolean, default: false },
    author: { type: Schema.Types.ObjectId, ref: 'User' },

    moderationMessage: { type: String, },

    createdDay: { type: Number },
})

module.exports = model('CatalogTrip', CatalogTripSchema);
