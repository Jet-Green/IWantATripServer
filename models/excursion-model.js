const { Schema, model } = require('mongoose')

const ExcursionSchema = new Schema({
    name: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    contacts: { type: Object },
    description: { type: String },
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    duration: { type: String },
    minPeople: { type: Number },
    maxPeople: { type: Number },
    // guides: [{ type: [Schema.Types.ObjectId], ref: 'Guide' }],
    guides: [{ name: { type: String } }],
    excursionType: { type: Object },
    startPlace: { type: String },
    prices: { type: [Object] },
    images: { type: [String] },
    minAge: { type: Number },
    deadline: { type: String },
    requirements: { type: String },
    availability: { type: String }
})

module.exports = model('Excursion', ExcursionSchema);
