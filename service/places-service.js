const PlaceModel = require('../models/place-model')

module.exports = {
  async create(place) {
    return await PlaceModel.create(place)
  },
  async setPlaceImagesUrls(_id, filenames) {
    return await PlaceModel.findByIdAndUpdate(_id, { $set: { images: filenames } })
  }
}