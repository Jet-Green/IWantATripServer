const { Schema, model } = require('mongoose');

// user, mamnger, admin
const TaxiSchema = new Schema({
    name: String,
    phone: String,
    location: Object,
})

module.exports = model('Taxi', TaxiSchema);