const { Schema, model } = require('mongoose')

const BillSchema = new Schema({
    cart: Array,
    isBoughtNow: { type: Boolean, default: false },
    userId: String,
    tripId: String,
    userInfo: Object
})

module.exports = model('Bill', BillSchema);