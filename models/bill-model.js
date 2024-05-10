const { Schema, model } = require('mongoose')

const BillSchema = new Schema({
    cart: Array,
    selectedStartLocation: String,
    date: Number,
    isWaitingList: Boolean,
    payment: {
        amount: { type: Number, default: 0 },
        documents: [{ paySum: Number, payDocument: String }]
    },
    tinkoff: { type: Object },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
    userInfo: {
        phone: String,
        fullname: String,
    },
    seats: {
        type: [String],
    },
    touristsList: [{
        fullname: String,
        phone: String,
        _id: false,
    }],
    userComment: { type: String }
})

module.exports = model('Bill', BillSchema);