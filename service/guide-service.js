const GuideElementModel = require('../models/guide-element-model')
const GuideModel = require('../models/guide-model')
const TaxiModel = require('../models/taxi-model')

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
    async deleteOne(_id) {
        return GuideElementModel.deleteOne({ _id: _id })
    },
    async getAllElements(type) {
        return GuideElementModel.find({ 'type': type }).exec()
    },
    async addGuide(guide) {
        return await GuideModel.create(guide)
    },
    async getGuides(searchQuery,dbSkip) {
        // --- Database Query Construction ---
        limit=2
        let dbQuery = {};
        if (searchQuery!="") { // Check if searchQuery is truthy (not null, undefined, or empty string)
            dbQuery = {
                $or: [
                    { offer: { $regex: searchQuery, $options: "i" } },
                    { location: { $regex: searchQuery, $options: "i" } },
                    { name: { $regex: searchQuery, $options: "i" } },
                    { surname: { $regex: searchQuery, $options: "i" } }
                ],
            };
        }

        const fetchedGuides = await GuideModel.find(dbQuery)
            .skip(dbSkip)       // Skip documents based on previous fetches
            .limit(limit)       // Limit the number of results for this batch
            .lean();            // Use lean() for better performance if Mongoose features aren't needed

        // --- Calculate skip for the next potential fetch ---
        // The skip value for the *next* request should be the current skip + the number of items we actually got.
        const nextdbSkip = dbSkip + fetchedGuides.length;

        // --- Return the fetched data and pagination info ---
        return {
            data: fetchedGuides,      // The guides retrieved in this call
            dbSkip: dbSkip,   // The starting point (skip value) for the next DB query
            ended:true,
        };
    },
    setTaxi(taxi) {
        return TaxiModel.create(taxi)
    },
    getLocalTaxi(location) {
        if (location == null) {
            return TaxiModel.find({})
        } else {
            return TaxiModel.find({ location: location})
        }
    },
    deleteTaxi(_id) {
        return TaxiModel.deleteOne({ _id: _id })
    },
}