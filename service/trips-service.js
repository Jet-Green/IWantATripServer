const TripModel = require('../models/trip-model.js');
const multer = require('../middleware/multer-middleware')
const UserService = require('./user-service')

module.exports = {
    async insertOne(trip) {
        return TripModel.create(trip)
    },
    async updateOne(trip) {
        let _id = trip._id
        delete trip._id

        let oldTrip = await TripModel.findById(_id)

        let imagesToDelete = []
        for (let oldImg of oldTrip.images) {
            let isOldImg = true
            for (let newImg of trip.images) {
                if (newImg == oldImg) {
                    isOldImg = false
                }
            }
            if (isOldImg) {
                imagesToDelete.push(oldImg)
            }
        }
        multer.deleteImages(imagesToDelete)

        oldTrip.overwrite(trip)

        return await oldTrip.save()
    },
    async updateTripImagesUrls(_id, filenames) {
        const trip = await TripModel.findById(_id)
        for (let f of filenames) {
            let isUnique = true;
            for (let i = 0; i < trip.images.length; i++) {
                if (trip.images[i] == f) {
                    isUnique = false
                    break
                }
            }
            if (isUnique) {
                trip.images.push(f)
            }
        }
        return trip.save()
    },
    async deleteMany() {
        return TripModel.deleteMany({})
    },
    async deleteOne(_id) {
        UserService.update({ $pull: { trips: _id } })

        let trip = await TripModel.findById(_id)
        let images = trip.images
        multer.deleteImages(images)

        return trip.remove()
    },
    async findMany() {
        return TripModel.find({}).exec()
    },
    async hide(_id, v) {
        return TripModel.findByIdAndUpdate(_id, { isHidden: v })
    },
    async moderate(_id, v) {
        return TripModel.findByIdAndUpdate(_id, { isModerated: v })
    },
    async findById(_id) {
        return TripModel.findById(_id).exec()
    },
}