const { Schema, model } = require('mongoose')

const AppStateSchema = new Schema({
    mainPageMessage: [{ type: String, default: '' }],
    tripType: [String],
    transport: [Object],
    sendMailsTo: {
        type: [Object],
        default: [
            {
                type: 'BookingTrip',
                emails: []
            },
            {
                type: 'CreateTrip',
                emails: []
            },
            {
                type: 'CreateCompanion',
                emails: []
            },
            {
                type: 'BuyTrip',
                emails: []
            },
        ]
    },
    taxi: [Object],
    cabinetNotifications: {
        type: [Object],
        default: [
            {
                type: 'BookingTrip',
                emails: []
            },
            {
                type: 'CreateTrip',
                emails: []
            },
            {
                type: 'CreateCompanion',
                emails: []
            },
            {
                type: 'BuyTrip',
                emails: []
            },
        ]
    },
  

})

module.exports = model('AppState', AppStateSchema);
