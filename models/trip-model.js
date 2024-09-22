const { Schema, model } = require('mongoose')

const LocationModel = require('./location-model')

const LocationSchema = LocationModel.schema

const TripSchema = new Schema({
    name: { type: String },
    start: { type: Number },
    end: { type: Number },
    timezoneOffset:{ type: Number },
    maxPeople: { type: Number },
    duration: { type: String },
    images: { type: Array },
    pdfs: { type: Array },
    tripRoute: { type: String },
    distance: { type: String },
    cost: { type: Array },
    offer: { type: String },
    description: { type: String },
    dayByDayDescription: { type: [String] },
    rejected: { type: Boolean, default: false },

    startLocation: { type: Object },
    includedLocations: {
        type: Object,
    },
    locationNames: [LocationSchema],

    tripType: { type: String },
    fromAge: { type: String },
    // меняет только пользователь
    isHidden: { type: Boolean, default: false },
    // меняет модератор
    isModerated: { type: Boolean, default: false },
    billsList: { type: [Schema.Types.ObjectId], ref: 'Bill' },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    bonuses: Array,

    moderationMessage: { type: String, },
    partner: { type: String, },
    canSellPartnerTour: { type: Boolean, default: false },
    children:
        [
            {
                _id: {
                    type: Schema.Types.ObjectId, ref: 'Trip'
                },
                start: Number,
                end: Number
            }
        ],
    parent: { type: Schema.Types.ObjectId, ref: 'Trip' },
    returnConditions: String,
    includedInPrice: String,
    paidExtra: String,
    travelRequirement: String,
    transports: {
        type: [Object]
    },
    createdDay: { type: Number },
    userComment: { type: String },
    tinkoffContract: {
        ShopCode: Number,
        Name: String,
        Inn: String,
        Phones: Array,
    },
    isCatalog: { type: Boolean, default: false },
    calculator: { type: Schema.Types.ObjectId, ref: 'TripCalc', required: false, default: null },
    additionalServices: {
        type: [
            { name: String, price: Number }
        ],
        default: [],
        required: false
    },
    tripRegion: String,
})

module.exports = model('Trip', TripSchema);
