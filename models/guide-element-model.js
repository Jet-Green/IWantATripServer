const { Schema, model } = require('mongoose')

const GuideElementSchema = new Schema({
    image: { type: String },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    socialMedia: { type: String, required: true },
    description: { type: String, required: true },
    // watch, eat, go ...
    type: { type: String, required: true },
    taxi: [Object],
})

module.exports = model('GuideElement', GuideElementSchema);