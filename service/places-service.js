const PlaceModel = require("../models/place-model");
const sanitizeHtml = require('sanitize-html');
function sanitize(input) {    return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br'],
    allowedAttributes: {
        'a': ['href', 'target', 'rel'], // Разрешаем только ссылки и их атрибуты
        'img': ['src', 'alt', 'title', 'width', 'height'] // Разрешаем изображения и их атрибуты
    },
    allowedSchemes: ['http', 'https', 'data'], // Запрещаем потенциально опасные схемы (например, javascript:)
    allowedSchemesByTag: {
        img: ['http', 'https', 'data'] // Специально для тегов <img>
    },
    // Предотвращаем JavaScript-инъекции
    enforceHtmlBoundary: true
})
}
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
    let location=baseQuery.conditions ?baseQuery.conditions.location : null
    let locationRadius=baseQuery.conditions ? baseQuery.conditions.locationRadius : null
    delete baseQuery.conditions;
    if (location?.name) {
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
      locationRadius != 0 &&
      locationRadius
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
    if (location?.name) {
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
      locationRadius
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
    place.description=sanitize(place.description)
    return await PlaceModel.create(place);
  },
  async delete(_id) {
    return await PlaceModel.findByIdAndDelete(_id);
  },

  async edit(place, placeId) {
    place.description=sanitize(place.description)
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
