const PlaceModel = require('../models/place-model')

module.exports = {
  async getAll(filter) {
   
    const limit = 1;
    const page = filter.sitePage || 1;
    const skip = (page - 1) * limit;
    let query = {}

                
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
  async setPlaceImagesUrls(_id, filenames) {
    return await PlaceModel.findByIdAndUpdate(_id, { $set: { images: filenames } })
  }
}