const {Schema, model} = require('mongoose');

const TrackSchema = new Schema({
  title: {type: String, required: true},
  subtitle: {type: String, default: ''},
  description: {type: String, default: ''},
  type: {type: String, required: true}, // пешком, на велосипеде и т.д.
  places: [{type: Schema.Types.ObjectId, ref: 'Place'}], // массив мест
  author: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  createdDate: {type: Date, default: Date.now},
  isActive: {type: Boolean, default: true}
});

module.exports = model('Track', TrackSchema);
