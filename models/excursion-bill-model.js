const { Schema, model } = require('mongoose')

const ExcursionDateModel = require('./excursion-date-model')

const ExcursionBillSchema = new Schema({
  time: { type: Schema.Types.ObjectId },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  cart: { type: Array },
},
  {
    methods: {
      async populateTime(cb) {
        console.log(cb);
        let timeId = this.time
        let excursionDateFromDb = await ExcursionDateModel.findOne({ times: { $elemMatch: { _id: timeId } } })
        for (let t of excursionDateFromDb.times) {
          if (t._id == timeId) {
            return t
          }
        }
        return {}
      }
    }
  })

module.exports = model('ExcursionBill', ExcursionBillSchema);