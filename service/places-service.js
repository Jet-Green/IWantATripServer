const PlaceModel = require('../models/place-model')

module.exports = {
  async getAll(filter) {
    console.log(filter)
    const limit = 20;
    const page = filter.page || 1;
    const skip = (page - 1) * limit;
    let query = filter.query

    const cursor = PlaceModel.find(query).skip(skip).limit(limit).cursor();

    const results = [];
    for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
      results.push(doc);
    }

    return results
  },

  async create(place) {
    return await PlaceModel.create(place)
  },
  async delete(_id) {

    return await PlaceModel.findByIdAndDelete(_id)
  },
  async setPlaceImagesUrls(_id, filenames) {
    return await PlaceModel.findByIdAndUpdate(_id, { $set: { images: filenames } })
  },
  

  async getById(_id) {
    return await PlaceModel.findById(_id).populate({
      path: 'author',
      select: {
        fullname: 1,
        fullinfo: 1,
      }
    })
  },
  async moderatePlace(_id) {
    return await PlaceModel.findByIdAndUpdate(_id, { isModerated: true, isRejected: false   })
  },
  async rejectPlace(_id) {
    return await PlaceModel.findByIdAndUpdate(_id, { isRejected: true })
  },
  
}