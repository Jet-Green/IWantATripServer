const { Schema, model } = require('mongoose')

const GuideSchema = new Schema({
    name: { type: String, required: true },
    surname: String,
    image: { type: String },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    offer: String,
    socialMedia: String,
    description: String,
    location: String,
})

module.exports = model('Guide', GuideSchema);