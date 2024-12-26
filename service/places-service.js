const PlaceModel = require("../models/place-model");

const tripFilter = {
  $and: [
    { isHidden: false, isModerated: true, rejected: false },
    { parent: { $exists: false } },
    {
      $or: [
        {
          // всё, что относится к родителю
          $and: [{ start: { $gte: Date.now() } }],
        },
        // все, что относится к children
        {
          children: {
            $elemMatch: {
              start: { $gte: Date.now() },
            },
          },
        },
      ],
    },
  ],
};
module.exports = {
  async getAll(filter) {
    const limit = 20;
    const page = filter.page || 1;
    const skip = (page - 1) * limit;
    let baseQuery = filter.query;
    let locationQuery = null;
    let radiusQuery = null;
    
    if (baseQuery.conditions) {
      // baseQuery.$and = [];
      if (baseQuery.conditions?.category) {
        baseQuery.category= baseQuery.conditions.category
      }
      if (baseQuery.conditions?.name) {
        baseQuery.name={ $regex: baseQuery.conditions.name, $options: "i" }
      }
    }
    let location=null
    let locationRadius=null
    if (baseQuery.conditions) {
      location=baseQuery.conditions?.location
      locationRadius=baseQuery.conditions?.locationRadius
      baseQuery.conditions = null;
    }
    if (location?.name != "") {
      locationQuery = {
        ...baseQuery,
        "location.name": {
          $regex: location?.name,
          $options: "i",
        },
      };
    }

    if (
      location?.coordinates &&
      baseQuery.conditions?.locationRadius != 0 &&
      baseQuery.conditions?.locationRadius != ""
    ) {
      radiusQuery = {
        ...baseQuery,
        "location.coordinates": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: location?.coordinates,
            },
            $maxDistance: Number(locationRadius) * 1000,
          },
        },
      };
    }
    
    const cursorBase = PlaceModel.find(baseQuery, null)
      .populate({
        path: "trips",
        match: tripFilter,
        select: {
          name: 1,
        },
      })
      .skip(skip)
      .limit(limit)
      .cursor();

    const cursorLocation = locationQuery
      ? PlaceModel.find(locationQuery, null)
          .populate({
            path: "trips",
            match: tripFilter,
            select: {
              name: 1,
            },
          })
          .skip(skip)
          .limit(limit)
          .cursor()
      : null;

    const cursorRadius = radiusQuery
      ? PlaceModel.find(radiusQuery, null)
          .populate({
            path: "trips",
            match: tripFilter,
            select: {
              name: 1,
            },
          })
          .skip(skip)
          .limit(limit)
          .cursor()
      : null;

    const results = [];
    const seenDocs = new Set(); // To prevent duplicates
    

    if (!location) {
      for (
        let doc = await cursorBase.next();
        doc != null;
        doc = await cursorBase.next()
      ) {
        if (!seenDocs.has(doc._id.toString())) {
          results.push(doc);
          seenDocs.add(doc._id.toString());
        }
      }
    }

    // Collect results from locationQuery (if defined)
    if (location?.name != "") {
      for (
        let doc = await cursorLocation.next();
        doc != null;
        doc = await cursorLocation.next()
      ) {
        if (!seenDocs.has(doc._id.toString())) {
          results.push(doc);
          seenDocs.add(doc._id.toString());
        }
      }
    }

    // Collect results from radiusQuery (if defined)
    if (
      location?.coordinates &&
      locationRadius != 0 &&
      locationRadius != ""
    ) {
      for (
        let doc = await cursorRadius.next();
        doc != null;
        doc = await cursorRadius.next()
      ) {
        if (!seenDocs.has(doc._id.toString())) {
          results.push(doc);
          seenDocs.add(doc._id.toString());
        }
      }
    }

    return results;
  },

  async create(place) {
    return await PlaceModel.create(place);
  },
  async delete(_id) {
    return await PlaceModel.findByIdAndDelete(_id);
  },

  async edit(place, placeId) {
    return await PlaceModel.findByIdAndUpdate(placeId, place);
  },

  async setPlaceImagesUrls(_id, filenames) {
    return await PlaceModel.findByIdAndUpdate(_id, {
      $set: { images: filenames },
    });
  },
  async pushPlaceImagesUrls(_id, filenames) {
    return await PlaceModel.findByIdAndUpdate(_id, {
      $push: { images: { $each: filenames } },
    });
  },

  async getById(_id) {
    return await PlaceModel.findById(_id)
      .populate({
        path: "author",
        select: {
          fullname: 1,
          fullinfo: 1,
        },
      })
      .populate({
        path: "trips",
        match: tripFilter,
        select: {
          name: 1,
        },
      });
  },
  async moderatePlace(_id) {
    return await PlaceModel.findByIdAndUpdate(_id, {
      isModerated: true,
      isRejected: false,
    });
  },
  async rejectPlace(_id) {
    return await PlaceModel.findByIdAndUpdate(_id, { isRejected: true });
  },

  async hidePlace(_id) {
    const place = await PlaceModel.findById(_id);
    if (!place) {
      throw new Error("Place not found");
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
    });
  },
  async updateWithTrips(places, tripId) {
    // Удаляем tripId из всех документов
    await PlaceModel.updateMany({}, { $pull: { trips: tripId } });

    // Добавляем tripId в указанные документы
    return await PlaceModel.updateMany(
      { _id: { $in: places } },
      { $push: { trips: tripId } }
    );
  },
};
