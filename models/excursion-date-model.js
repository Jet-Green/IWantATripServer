const { Schema, model } = require('mongoose')

const ExcursionDateSchema = new Schema({
    date: Object,
    times: [{
        hours: Number,
        minutes: Number,
        bills: [{ type: Schema.Types.ObjectId, ref: 'ExcursionBill' }]
    }],
    excursion: { type: Schema.Types.ObjectId, ref: 'Excursion' },
})

module.exports = model('ExcursionDate', ExcursionDateSchema);