const TripModel = require('../models/trip-model.js');
const UserModel = require('../models/user-model.js')
const BillModel = require('../models/bill-model.js')

const ApiError = require('../exceptions/api-error.js')
const multer = require('../middleware/multer-middleware')
const UserService = require('./user-service')

const { sendMail } = require('../middleware/mailer');

const LocationService = require('./location-service.js')

const _ = require('lodash')

module.exports = {
    async createManyByDates({ dates, parentId }) {
        let parent = await TripModel.findById(parentId)

        let createdIds = []
        for (let d of dates) {
            let r = await TripModel.create({ start: d.start, end: d.end, parent: parentId, author: d.author })
            parent.children.push(r._id)
            createdIds.push(r._id)
        }

        await parent.save()

        return createdIds
    },
    async deletePayment(_id) {
        let bill = await BillModel.findById(_id)

        await TripModel.findOneAndUpdate({ _id: bill.tripId }, { $pull: { billsList: { $eq: bill._id } } })

        return bill.delete()
    },
    async setPayment(bill) {
        return await BillModel.findByIdAndUpdate(bill._id, { 'payment.amount': bill.payment.amount })
    },
    async getFullTripById(_id) {
        let trip = await TripModel.findById(_id).populate('author', { fullinfo: 1 }).populate('children', { start: 1, end: 1 }).populate('parent')
        if (trip.parent) {
            let originalId = trip._id
            let parentId = trip.parent._id
            let { start, end, billsList } = trip
            let isModerated = trip.parent.isModerated

            Object.assign(trip, trip.parent)
            trip.parent = parentId
            trip.children = []
            trip._id = originalId
            trip.start = start
            trip.end = end
            trip.isModerated = isModerated
            trip.billsList = billsList
        }
        await trip.populate('billsList')
        return trip
    },
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
        let bill = req.body.bill
        let billFromDb = await BillModel.create(bill)

        await TripModel.findOneAndUpdate({ _id: tripId }, { $push: { billsList: billFromDb._id } })

        let userId = bill.userInfo._id

        return await UserModel.findOneAndUpdate({ _id: userId }, { $push: { boughtTrips: billFromDb._id } })
    },
    async insertOne(trip) {
        return TripModel.create(trip)
    },
    async updateOne(trip) {
        let _id = trip._id
        delete trip._id

        let oldTrip = await TripModel.findById(_id)
        trip.startLocation = await LocationService.createLocation(trip.startLocation)

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
    async findMany(sitePage, lon, lat, strQuery, start, end) {
        const limit = 20;
        const page = sitePage || 1;
        const skip = (page - 1) * limit;
        let query = {
            $and: [
                { isHidden: false, isModerated: true },
                { "parent": { $exists: false } }
            ]
        }

        if (lon && lat) {
            query.$and.push({
                startLocation: {
                    $near: {
                        $geometry: {
                            type: 'Pointer',
                            coordinates: [Number(lon), Number(lat)]
                        },
                        // 100 km
                        $maxDistance: 100000
                    }
                }
            })
        }
        if (strQuery) {
            query.$and.push({
                $or: [
                    { name: { $regex: strQuery, $options: 'i' } },
                    { tripRoute: { $regex: strQuery, $options: 'i' } },
                    { offer: { $regex: strQuery, $options: 'i' } },
                    { description: { $regex: strQuery, $options: 'i' } },
                ]
            })
        }
        if (start && end) {
            query.$and.push({
                start: { $gte: start },
                end: { $lte: end }
            })
        } else {
            query.$and.push({ start: { $gte: Date.now() } })
        }

        const cursor = TripModel.find(query, null, { sort: 'start' }).populate("children", { start: 1, end: 1 }).skip(skip).limit(limit).cursor();

        const results = [];
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            results.push(doc);
        }

        return results
    },
    async findForSearch(s, cursor) {
        const { query, when } = s

        // если пустой фильтр
        if (!query && !when.start) {
            return await TripModel.find({ isHidden: false, isModerated: true })
        }
        let filter = {
            $and: [
                {
                    $or: [
                        { name: { $regex: query, $options: 'i' } },
                        { description: { $regex: query, $options: 'i' } },

                    ]
                },

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
    async findForModeration() {
        return TripModel.find({
            $and: [{ isModerated: false },
            { "parent": { $exists: false } }]
        }).populate('author', { fullinfo: 1 })
    },
    async moderate(_id, v) {
        return TripModel.findByIdAndUpdate(_id, { isModerated: v })
    },
    async sendModerationMessage(tripId, msg) {
        return TripModel.findByIdAndUpdate(tripId, { isModerated: false, moderationMessage: msg })
    },
    async findById(_id) {
        return TripModel.findById(_id).populate('author')
    },
    async createdTripsInfo(_id) {
        let tripsIdArray = []
        let tripsInfoArray = []

        await UserModel.findById(_id, { "trips": 1 }).then(data => {
            tripsIdArray = data.trips
        })
        await TripModel.find({ _id: { $in: tripsIdArray } }).populate('parent').then((data) => {
            let result = []
            for (let trip of data) {
                if (trip.parent) {
                    let originalId = trip._id
                    let parentId = trip.parent._id
                    let { start, end } = trip
                    let isModerated = trip.parent.isModerated

                    Object.assign(trip, trip.parent)
                    trip.parent = parentId
                    trip.children = []
                    trip._id = originalId
                    trip.start = start
                    trip.end = end
                    trip.isModerated = isModerated
                }

                result.push(trip)
            }
            tripsInfoArray = result
        })

        return tripsInfoArray
    },
}