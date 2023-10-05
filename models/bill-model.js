const { Schema, model } = require('mongoose')

const BillSchema = new Schema({
    cart: Array,
    payment: {
        amount: { type: Number, default: 0 },
    },
    tinkoff: { type: Object },
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