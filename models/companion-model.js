const { Schema, model } = require('mongoose')

const CompanionSchema = new Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    start: { type: Number, required: true },
    end: { type: Number, required: true },
    age: { type: String, required: true },
    gender: { type: String, required: true },
    companionGender: { type: String, required: true },
    // type: [{ type: String, required: true }],
    direction: { type: String, required: true },
    description: { type: String, required: true },
    companionRequests: Array,
    startLocation: Object
})

module.exports = model('Companion', CompanionSchema);
