const { Schema, model } = require('mongoose')

const AppStateSchema = new Schema({
    mainPageMessage: [{ type: String, default: '' }],
    tripType: [String],
    transport: [Object],
  
    sendMailsTo: { type: Object, default: { 'CreateTrip': [], 'CreateCompanion': [], 'BookingTrip': [], 'BuyTrip': [] } }
})

module.exports = model('AppState', AppStateSchema);
