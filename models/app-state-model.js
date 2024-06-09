const { Schema, model } = require('mongoose')

const AppStateSchema = new Schema({
    mainPageMessage: [{ type: String, default: '' }],
    tripType: [String],
    excursionTypes: [Object],
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
