const { Schema, model } = require('mongoose')

const BillSchema = new Schema({
    cart: Array,
    payment: {
        amount: { type: Number, default: 0 },
    },
    tripId: String,
    userInfo: { type: Object, default: {} }
})

module.exports = model('Bill', BillSchema);