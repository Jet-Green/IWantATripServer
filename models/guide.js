const { Schema, model } = require('mongoose')

const GuideSchema = new Schema({
    name: String,
//   add more
})

module.exports = model('Guide', GuideSchema);