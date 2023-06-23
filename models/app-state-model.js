const { Schema, model } = require('mongoose')

const AppStateSchema = new Schema({
    mainPageMessage: [{ type: String, default: '' }],
    tripType: [String],
    sendMailsTo: { type: Object, default: { 'CreateTrip': [], 'CreateCompanion': [], 'BookingTrip': [] } }
})

module.exports = model('AppState', AppStateSchema);
