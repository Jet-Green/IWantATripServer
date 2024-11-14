const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  location: {
    name: { type: String, default: '' },
    shortName: { type: String, default: '' },
    type: { type: String, default: 'Point' },
    coordinates: [Number],
  },
  images: {
    type: Array,
  },
  shortDescription: {
    type: String,
    required: true,
  },
  // quill
  description: {
    type: String,
    required: true,
  },

  advicesForTourists: {
    type: String,
    required: true,
  },
  // quill
  openingHours: {
    type: String,
  },
  price: {
    type: String,
  },
  website: {
    type: String,
  },

  category: {
    type: String,
  },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdDate: { type: Number },
  isModerated: { type: Boolean, default: false },
  isHidden: { type: Boolean, default: false },
  isRejected: { type: Boolean, default: false },
  moderationMessage: { type: String },

  trips: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Trip' }],
});

const Place = mongoose.model('Place', placeSchema);

module.exports = Place;