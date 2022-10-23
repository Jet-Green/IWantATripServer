const TripModel = require('../models/trip-model.js');

module.exports = {
    async insertOne(trip) {
        return TripModel.create(trip)
    },
    async updateTripImagesUrls(_id, filenames) {
        const trip = await TripModel.findById(_id)
        trip.images = filenames
        return trip.save()
    },
    async deleteMany() {
        return TripModel.deleteMany({})
    },
    async findMany() {
        return TripModel.find({}).exec()
    },
    async findById(_id) {
        return TripModel.findById(_id).exec()
    }
}