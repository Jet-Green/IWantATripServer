const { Schema, model } = require('mongoose')

const BillSchema = new Schema({
    cart: Array,
    payment: {
        amount: { type: Number, default: 0 },
    },
    tripId: { type: Schema.Types.ObjectId, ref: 'Trip' },
    userInfo: { type: Object, default: {} }
})

module.exports = model('Bill', BillSchema);