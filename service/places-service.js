const PlaceModel = require('../models/place-model')

const tripFilter = {
  $and: [
    { isHidden: false, isModerated: true, rejected: false },
    { "parent": { $exists: false } },
    {
      $or: [
        {
          // всё, что относится к родителю
          $and: [
            { 'start': { $gte: Date.now() } },
          ]
        },
        // все, что относится к children
        {
          children: {
            $elemMatch: {
              start: { $gte: Date.now() },
            }
          }
        }
      ]
    }
  ]
};
module.exports = {
  async getAll(filter) {

    const limit = 20;
    const page = filter.page || 1;
    const skip = (page - 1) * limit;
    let query = filter.query

    if (query.conditions) {
      query.$and = [];
      if (query.conditions.location) {
        query.$and.push({
          'location.coordinates': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: query.conditions.location.coordinates,
              },
              $maxDistance: Number(query.conditions.locationRadius) * 1000
            }
          }
        });
      }
      if (query.conditions.name) {
        query.$and.push({ name: { $regex: query.conditions.name, $options: 'i' } });
      }

      if (query.conditions.category) {
        query.$and.push({ category: query.conditions.category });
      }
    }



    const cursor = PlaceModel.find(query).populate({
      path: 'trips',
      match: tripFilter,
      select: {
        name: 1,
      }
    }).skip(skip).limit(limit).cursor();

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

  async edit(place, placeId) {
    return await PlaceModel.findByIdAndUpdate(placeId, place)
  },

  async setPlaceImagesUrls(_id, filenames) {
    return await PlaceModel.findByIdAndUpdate(_id, { $set: { images: filenames } })
  },
  async pushPlaceImagesUrls(_id, filenames) {
    return await PlaceModel.findByIdAndUpdate(_id, { $push: { images: { $each: filenames } } })
  },

  async getById(_id) {
    return await PlaceModel.findById(_id).populate({
      path: 'author',
      select: {
        fullname: 1,
        fullinfo: 1,
      }
    }
    ).populate({
      path: 'trips',
      match: tripFilter,
      select: {
        name: 1,
      }
    })
  },
  async moderatePlace(_id) {
    return await PlaceModel.findByIdAndUpdate(_id, { isModerated: true, isRejected: false })
  },
  async rejectPlace(_id) {
    return await PlaceModel.findByIdAndUpdate(_id, { isRejected: true })
  },

  async hidePlace(_id) {
    const place = await PlaceModel.findById(_id);
    if (!place) {
      throw new Error('Place not found');
    }
    place.isHidden = !place.isHidden;
    // Сохраняем обновленный документ
    await place.save();
    return place;
  },
  async getForCreateTrip() {
    return await PlaceModel.find({}).limit(50).select({
      location: 1,
      name: 1,
    })
  },
  async updateWithTrips(places, tripId) {
   // Удаляем tripId из всех документов
   await PlaceModel.updateMany(
    { },
    { $pull: { trips: tripId } }
  );

  // Добавляем tripId в указанные документы
  return await PlaceModel.updateMany(
    { _id: { $in: places } },
    { $push: { trips: tripId } }
  );

  }
}