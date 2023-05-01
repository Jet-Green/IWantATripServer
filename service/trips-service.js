const TripModel = require('../models/trip-model.js');
const UserModel = require('../models/user-model.js')

const ApiError = require('../exceptions/api-error.js')
const multer = require('../middleware/multer-middleware')
const UserService = require('./user-service')

const LocationService = require('./location-service.js')

const _ = require('lodash')

module.exports = {
    async getCustomers(customersIds) {
        let query = []

        for (let cid of customersIds) {
            query.push({ _id: cid })
        }

        let customersFromDB = await UserModel.find({ $or: query })

        let usersToSend = []
        for (let user of customersFromDB) {
            usersToSend.push({
                fullname: user.fullinfo.fullname,
                type: user.fullinfo.type,
                phone: user.fullinfo.phone
            })
        }

        return usersToSend
    },
    async buyTrip(req) {
        let tripId = req.query._id
        let bill = req.body

        await TripModel.findOneAndUpdate({ _id: tripId }, { $push: { billsList: bill } })

        let { userId } = bill
        delete bill.userId

        return await UserModel.findOneAndUpdate({ _id: userId }, { $push: { boughtTrips: { tripId, ...bill } } })
    },
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
        let tripToDelete = await TripModel.findById(_id)

        // if bought by user
        if (tripToDelete.billsList.length > 0) {
            throw ApiError.BadRequest('Нельзя удалять купленные туры')
        }

        await UserService.update({ $pull: { trips: _id } })

        let images = tripToDelete.images
        multer.deleteImages(images)

        return tripToDelete.remove()

    },
    async findMany(cursor, geo_lat, geo_lon) {

        let tripsFromDB = await TripModel.find({ start: { $gt: Date.now() } }, null, { sort: 'start' }).skip(cursor ? cursor : 0).limit(20)
        let toSend = []
        for (let trip of tripsFromDB) {
            if (LocationService.isNearPlace({ geo_lat, geo_lon }, trip.startLocation)) {
                toSend.push(trip)
            }
        }
        return toSend
    },
    async findForSearch(s, cursor) {
        const { query, place, when } = s

        // если пустой фильтр
        if (!query && !place && !when.start) {
            return await TripModel.find({ isHidden: false, isModerated: true })
        }
        let filter = {
            $and: [
                {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } },
                        { location: { $regex: query, $options: 'i' } },
                    ]
                },
                { location: { $regex: place, $options: 'i' } },
                {
                    isHidden: false, isModerated: true
                }
            ]
        }
        if (when.start && when.end) {
            filter.$and.push({
                $and: [
                    { start: { $gte: when.start } },
                    { end: { $lte: when.end } },
                ]
            })
        }

        filter.$and.push({ start: { $gt: Date.now() } })
        return await TripModel.find(filter, null, { sort: 'start' }).skip(cursor ? cursor : 0).limit(20)
    },
    async hide(_id, v) {
        return TripModel.findByIdAndUpdate(_id, { isHidden: v })
    },
    async moderate(_id, v) {
        return TripModel.findByIdAndUpdate(_id, { isModerated: v })
    },
    async findById(_id) {
        return TripModel.findById(_id)
    },
}