const { Schema, model } = require('mongoose')

const LocationSchema = new Schema({
    name: String,
    shortName: String,
    geo_lat: { type: String, unique: true },
    geo_lon: { type: String, unique: true },
})

module.exports = model('Location', LocationSchema);