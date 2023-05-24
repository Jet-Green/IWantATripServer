const { Schema, model } = require('mongoose')

const LocationSchema = new Schema({
    name: String,
    shortName: String,
    location: Object
})

module.exports = model('Location', LocationSchema);