const { Schema, model } = require('mongoose')

const ExcursionBillSchema = new Schema({
  time: id,
  cart: {
    count: 123,
  },
})

module.exports = model('ExcursionBill', ExcursionBillSchema);