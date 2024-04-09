const { Schema, model } = require('mongoose')

const ExcursionSchema = new Schema({
    name: { type: String, required: true },
})

module.exports = model('Excursion', ExcursionSchema);
