const { Schema, model } = require('mongoose')

const ExcursionDateSchema = new Schema({
    date: Object,
    times: [{
        hours: Number,
        minutes: Number,
    }],
    excursion: { type: Schema.Types.ObjectId, ref: 'Excursion' },
})

module.exports = model('ExcursionDate', ExcursionDateSchema);