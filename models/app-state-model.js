const { Schema, model } = require('mongoose')

const AppStateSchema = new Schema({
    mainPageMessage: [{ type: String, default: '' }],
    tripType: [String],
    excursionTypes: [Object],
    placeCategory:[String],
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
                type: 'CreateExcurtion',
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
    tripRegions: [String]
})

module.exports = model('AppState', AppStateSchema);
