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
    user : { type: Schema.Types.ObjectId, ref: 'User' }
})

module.exports = model('Guide', GuideSchema);