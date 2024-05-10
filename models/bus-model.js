const { Schema, model } = require('mongoose');

const BusSchema = new Schema({
    name: { type: String, required: true },
    author: { type: String, required: true },
    aspect_ratio: { type: Number, required: true },
    seats: { type: Array, required: true },
    stuff: { type: Array, required: true }
})

module.exports = model('Bus', BusSchema);