const GuideElementModel = require('../models/guide-element-model')
const GuideModel = require('../models/guide-model')
const TaxiModel = require('../models/taxi-model')
const UserModel = require('../models/user-model')
const ExcursionModel = require('../models/excursion-model')

const ApiError = require("../exceptions/api-error.js");
const { get } = require('lodash');

module.exports = {
    async clear() {
        return GuideElementModel.deleteMany({ 'type': 'watch' })
    },
    async createElement(element) {
        return GuideElementModel.create(element)
    },
    async updateGuideElementImage(_id, filename) {
        const element = await GuideElementModel.findById(_id)
        element.image = filename
        return element.save()
    },

    async getAllElements(type) {
        return GuideElementModel.find({ 'type': type }).exec()
    },
      // Гиды
    async addGuide(guide) {
        try {
            const user = await UserModel.findOne({ email: guide.email }).select('_id').lean();
            const guideToCreate = {
                ...guide,
                user: user._id,
            };
            return GuideModel.create(guideToCreate)
        } catch (e) {
            throw ApiError.BadRequest("Не удалось создать гида")
        }

    },

    async deleteById(_id) {
        try {
          return  await GuideModel.deleteOne({ _id: _id })
        }
        catch {
            throw ApiError.BadRequest("Не удалось удалить гида")
        }
    },
    async getGuideByEmail(email) {
        return await GuideModel.findOne({ email: email })
    },
    async getGuideById(_id) {
        return await GuideModel.findOne({ _id: _id })
    },
    async getGuideExcursions(_id) {
        //contains guide id in guides
        return await ExcursionModel.find({ guides: _id })
    },
    async moderateGuide(_id) {
        return GuideModel.findByIdAndUpdate(_id, { isModerated: true, isRejected: false })
    },
    async hideGuide(_id, isHidden) {
        return GuideModel.findByIdAndUpdate(_id, {isHidden: !isHidden})
    },
    async sendGuideModerationMessage(_id, msg) {
        return GuideModel.findByIdAndUpdate(_id, { isModerated: false, moderationMessage: msg, isRejected: true })
    },
    async updateGuide(guide) {
        let id = guide._id;
        return await GuideModel.findByIdAndUpdate(id, guide)
    },
    async pushGuideImagesUrls(_id, filename) {
        return await GuideModel.findByIdAndUpdate(_id, { image: filename });
    },
    async getGuides(page,filter) {
        const limit = 20;
        page = page || 1;
        const skip = (page - 1) * limit;
        console.log(filter)

        let baseQuery = {
            $and: [
                { isHidden: filter.isHidden, isModerated: filter.isModerated, isRejected: filter.isRejected },
            ],
        };
        let locationQuery = null;
        let radiusQuery = null;

        if (filter?.search != '') {
            baseQuery.$and.push = { $regex: filter.search, $options: "i" }
        }

        let location = filter ? filter.location : null
        let locationRadius = filter ? filter.locationRadius : null

        if (location?.name) {
            locationQuery = {
                $and:[
                    ...baseQuery.$and,
                    {
                        "location.name": {
                            $regex: location?.name,
                            $options: "i",
                        }
                    },
                ]
            };
        }

        if (
            location?.coordinates &&
            locationRadius != 0 &&
            locationRadius
        ) {
            radiusQuery = {
            $and:[
                ...baseQuery.$and,
                {
                    "location.coordinates": 
                    {
                        $near: {
                            $geometry: {
                            type: "Point",
                            coordinates: location?.coordinates,
                            },
                            $maxDistance: Number(locationRadius) * 1000,
                        },
                    },
                }
            ]
            };
        }

        const cursorBase = GuideModel.find(baseQuery, null)
        .skip(skip)
        .limit(limit)
        .cursor();

        const cursorLocation = locationQuery
        ? GuideModel.find(locationQuery, null)
        .skip(skip)
        .limit(limit)
        .cursor()
        : null;

        const cursorRadius = radiusQuery
        ? GuideModel.find(radiusQuery, null)
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
    async getGuidesByUserId(body) {
        const limit = 20;
        const page = body.page || 1;
        const skip = (page - 1) * limit;

        return GuideModel.find(body.query).skip(skip).limit(limit)

    },
    setTaxi(taxi) {
        return TaxiModel.create(taxi)
    },
    async getGuidesAutocomplete(query) {
        //get only name and id in range of 5
        return GuideModel.find({ $and: [{ name: { $regex: query, $options: 'i' } }, { isModerated: true }] }, { name: 1, _id: 1 }).limit(5)
    },
    getLocalTaxi(location) {
        if (location == null) {
            return TaxiModel.find({})
        } else {
            return TaxiModel.find({ location: location })
        }
    },
    deleteTaxi(_id) {
        return TaxiModel.deleteOne({ _id: _id })
    },
}