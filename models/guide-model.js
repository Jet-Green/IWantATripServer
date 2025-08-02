const { Schema, model } = require('mongoose')

const GuideSchema = new Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    image: { type: String },
    email: { type: String},
    phone: { type: String},
    offer: { type: String, required: true },
    socialMedia: String,
    description: { type: String, required: true },
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