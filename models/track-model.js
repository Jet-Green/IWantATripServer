const {Schema, model} = require('mongoose');

const TrackSchema = new Schema({
  title: {type: String, required: true},
  subtitle: {type: String, default: ''},
  description: {type: String, default: ''},
  type: {type: String, required: true}, // пешком, на велосипеде и т.д.
  places: [{type: Schema.Types.ObjectId, ref: 'Place'}], // массив мест
  length: {type: Number, default: 0}, // длина трека в км
  duration: {type: String, default: ''}, // продолжительность трека
  author: {type: Schema.Types.ObjectId, ref: 'User', required: true},
  createdDate: {type: Date, default: Date.now},
  isActive: {type: Boolean, default: true},
  isHidden: {
    type: Boolean,
    default: false         
  },
  isModerated: {
    type: Boolean,
    default: false          
  },
  isRejected: {
    type: Boolean,
    default: false         
  }
});

module.exports = model('Track', TrackSchema);
