const { Schema, model } = require('mongoose')

const CompanionSchema = new Schema({
    name: { type: String, required: true },
    surname: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
    age: { type: String, required: true },
    gender: { type: String, required: true },
    datestart: { type: String, required: true },
    dateend: { type: String, required: true },
    days: { type: String, required: true },
    description: { type: String, required: true },
})

module.exports = model('Companion', CompanionSchema);