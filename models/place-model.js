const mongoose = require('mongoose');

const placeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  // есть адрес - dadata. нет адреса, пишем координаты и название
  dadataLocation: null,
  customLocation: null,
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
  socialMedia: {
    type: String,
  },
  category: {
    type: String,
  }
});

const Place = mongoose.model('Place', placeSchema);

module.exports = Place;