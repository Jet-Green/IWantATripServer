const GuideElementModel = require('../models/guide-element-model')
const GuideModel = require('../models/guide-model')
const TaxiModel = require('../models/taxi-model')
const UserModel = require('../models/user-model')
const ExcursionModel = require('../models/excursion-model')
const tokenService = require("../service/token-service");

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
            return GuideModel.create(guide)
        } catch (e) {
            throw ApiError.BadRequest("Не удалось создать гида")
        }

    },

    async deleteById(_id) {
     
        
        try {
            return await GuideModel.deleteOne({ _id: _id })
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
        return GuideModel.findByIdAndUpdate(_id, { isHidden: !isHidden })
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
    async getVisibleGuidesIds() {
        const items = await GuideModel.find({ isHidden: false, isModerated: true, isRejected: false })
        return items.map(p => p._id.toString());
    },
    async getGuides(page, filter) {
        const limit = 20;
        page = page || 1;
        const skip = (page - 1) * limit;

        const baseQuery = {
            $and: [
                {
                    isModerated: filter.isModerated,
                    isRejected: filter.isRejected,
                    isHidden: filter.isHidden,
                },
            ],
        };
        if (filter?.search?.trim() !== '') {
            baseQuery.$and.push({
                $or: [
                    { offer: { $regex: filter.search, $options: "i" } },
                    { name: { $regex: filter.search, $options: "i" } },
                    { surname: { $regex: filter.search, $options: "i" } },
                ],
            });
        }
        let finalQuery = baseQuery;
        if (
            filter?.location?.coordinates &&
            filter.location.coordinates.length === 2 &&
            filter.locationRadius
        ) {
            finalQuery = {
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: filter.location.coordinates,
                        },
                        $maxDistance: Number(filter.locationRadius) * 1000,
                    },
                },
                ...baseQuery,
            };
        }
        const result = GuideModel.find(finalQuery)
        .skip(skip)
        .limit(limit);
        
        return result;
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
            return TaxiModel.find({ 'location._id': location._id })
        }
    },
    deleteTaxi(_id) {
        return TaxiModel.deleteOne({ _id: _id })
    },
}