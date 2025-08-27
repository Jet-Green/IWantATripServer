const { Schema, model } = require('mongoose')

const LocationSchema = new Schema({
    name: String,
    shortName: String,
    type: { type: String, default: 'Point' },
    coordinates: { type: Array, required: true },
    image: {type:String, default:""}
})

module.exports = model('Location', LocationSchema);