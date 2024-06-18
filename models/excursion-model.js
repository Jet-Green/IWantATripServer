const { Schema, model } = require('mongoose')

const ExcursionSchema = new Schema({
    name: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User' },
    contacts: { type: Object },
    description: { type: String },
    location: {
        name: String,
        shortName: String,
        type: { type: String, default: 'Point' },
        coordinates: [Number],
    },
    duration: { type: String },
    minPeople: { type: Number },
    maxPeople: { type: Number },
    // guides: [{ type: [Schema.Types.ObjectId], ref: 'Guide' }],
    guides: [{ name: { type: String } }],
    excursionType: { type: Object },
    startPlace: { type: String },
    prices: { type: [Object] },
    images: { type: [] },
    minAge: { type: Number },
    deadline: { type: String },
    requirements: { type: String },
    availability: { type: Boolean },
    // меняет только пользователь
    isHidden: { type: Boolean, default: false },
    // меняет модератор
    isModerated: { type: Boolean, default: false },
    tinkoffContract: {
        ShopCode: Number,
        Name: String,
        Inn: String,
        Phones: Array,
    },

    billsList: { type: [Schema.Types.ObjectId], ref: 'ExcursionBill' },

    dates: { type: [Schema.Types.ObjectId], ref: 'ExcursionDate' },
    bookings: { type: [Schema.Types.ObjectId], ref: 'ExcursionBooking' },
    orders: { type: [Object] }
})

module.exports = model('Excursion', ExcursionSchema);
