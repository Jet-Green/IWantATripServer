const { Schema, model } = require('mongoose')

const BillSchema = new Schema({
    cart: Array,
    isBoughtNow: { type: Boolean, default: false },
    tripId: String,
    userInfo: { type: Object, default: {} }
})

module.exports = model('Bill', BillSchema);