const { Schema, model } = require('mongoose')

const BillSchema = new Schema({
    cart: Array,
    selectedStartLocation: String,
    payment: {
        amount: { type: Number, default: 0 },
        documents: [{ paySum: Number, payDocument: String }]
    },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
    userInfo: {
        phone: String,
        fullname: String,
    },
    touristsList: [{
        fullname: String,
        phone: String,
        _id: false,
    }]
})

module.exports = model('Bill', BillSchema);