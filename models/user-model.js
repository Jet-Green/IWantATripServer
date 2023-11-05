const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    fullname: { type: String, required: true },
    fullinfo: {
        type: Object,
        default: {
            type: "phys",
            creatorsType: "author",
            fullname: '',
            phone: '',
            govermentRegNumber: '',
            companyName: ''
        }
    },
    trips: { type: Array },
    guideElements: { type: Array },
    createdCompanions: { type: Array },
    boughtTrips: [{ type: Schema.Types.ObjectId, ref: 'Bill' }],

    roles: { type: Array, default: ['user'] },
    userLocation: {
        type: Object,
        default: {}
    },

    tripCalc: [{ type: Schema.Types.ObjectId, ref: 'TripCalc' }],

    notifications: {
        type: [Object], default: [{
            type: 'BookingTrip',
            send: false
        },
        {
            type: 'CreateTrip',
            send: false
        },
        {
            type: 'CreateCompanion',
            send: false
        },
        {
            type: 'BuyTrip',
            send: false
        }]
    }
})

module.exports = model('User', UserSchema);