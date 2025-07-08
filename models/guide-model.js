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
    location: { type: Object },
    user : { type: Schema.Types.ObjectId, ref: 'User' },
    type: String,
    isHidden: { type: Boolean, default: false },
    isModerated: { type: Boolean, default: false },
    isRejected: { type: Boolean, default: false },
    moderationMessage: String,
    excursionsIn: [{ type: Schema.Types.ObjectId, ref: 'Excursion' }],
})

module.exports = model('Guide', GuideSchema);