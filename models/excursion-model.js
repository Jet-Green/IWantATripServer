const { Schema, model } = require('mongoose')

const ExcursionSchema = new Schema({
    name: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    contacts: { type: Object},
    time: { type: Schema.Types.ObjectId, ref: 'ExcursionDate'},
    description: { type: String },
    location: { type: Schema.Types.ObjectId, ref: 'Location' },
    duration: { type: String},
    minPeople:{type: Number},
    maxPeople: { type: Number},
    guedes: [{ type: [Schema.Types.ObjectId], ref: 'Guide' }],
    excursionType: { type: String},
    startPlace: { type: String },
    prices: { type: [Object]},
    images: { type: [String]},
    minAge: { type: Number},
    type: { type: Object},
    deadline: { type: String},
    requirements: { type: String},
    availability: { type: String}


})

module.exports = model('Excursion', ExcursionSchema);
