const { Schema, model } = require('mongoose')

const GuideElementSchema = new Schema({
    image: { type: String, required: true },
    name: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    socialMedia: { type: String, required: true },
    description: { type: String, required: true }
})

module.exports = model('GuideElement', GuideElementSchema);