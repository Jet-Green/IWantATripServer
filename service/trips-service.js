const TripModel = require('../models/trip-model.js');
const UserModel = require('../models/user-model.js')
const BillModel = require('../models/bill-model.js')
const LocationModel = require('../models/location-model.js')

const ApiError = require('../exceptions/api-error.js')
const multer = require('../middleware/multer-middleware')
const UserService = require('./user-service')

const { sendMail } = require('../middleware/mailer');

const LocationService = require('./location-service.js')

const _ = require('lodash');

module.exports = {
    async createManyByDates({ dates, parentId }) {
        let parent = await TripModel.findById(parentId)

        let createdIds = []
        for (let d of dates) {
            let r = await TripModel.create({ start: d.start, end: d.end, parent: parentId, author: d.author })
            parent.children.push({ _id: r._id, start: d.start, end: d.end })
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
        return await BillModel.findByIdAndUpdate(bill.bill._id, {
            $inc: { 'payment.amount': bill.bill.payment.amount },
            $push: { 'payment.documents': bill.doc }
        })
    },
    async getFullTripById(_id) {
        let trip = await TripModel.findById(_id)
            .populate('author', { fullinfo: 1 }).populate('parent')
            .populate({
                path: 'children._id',
                populate: {
                    path: 'billsList',
                    select: {
                        cart: 1,
                        payment: 1,
                        userInfo: 1,
                        touristsList: 1,
                        tinkoff: 1,
                        selectedStartLocation: 1,
                        userComment: 1,
                        additionalServices: 1,
                    }
                },
                select: { start: 1, end: 1, billsList: 1, touristsList: 1, selectedStartLocation: 1 },
            }).populate('places')

        if (trip.parent) {
            let originalId = trip._id
            let parentId = trip.parent._id
            let { start, end, billsList } = trip
            let isModerated = trip.parent.isModerated
            let rejected = trip.parent.rejected

            Object.assign(trip, trip.parent)
            trip.parent = parentId
            trip.children = []
            trip._id = originalId
            trip.start = start
            trip.end = end
            trip.isModerated = isModerated
            trip.rejected = rejected
            trip.billsList = billsList
        }

        await trip.populate('billsList', { cart: 1, additionalServices: 1, payment: 1, userInfo: 1, touristsList: 1, selectedStartLocation: 1, tinkoff: 1, userComment: 1, seats: 1, date: 1 })
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

        if (bill.seats) {
            let bill_same_seats = await BillModel.find({ tripId, seats: { $in: bill.seats } })
            let same_seats = bill_same_seats.map(bill => bill.seats).flat()
            same_seats = Array.from(new Set(same_seats))
            if (same_seats.length)
                throw ApiError.BadRequest(`Мест${same_seats.length === 1 ? 'о' : 'а'} ${same_seats.join(', ')} уже куплен${same_seats.length === 1 ? 'о' : 'ы'}`)
        }

        let billFromDb = await BillModel.create(bill)

        await TripModel.findOneAndUpdate({ _id: tripId }, { $push: { billsList: billFromDb._id } })

        let userId = bill.userInfo._id
        return { billId: billFromDb._id, userCallback: await UserModel.findOneAndUpdate({ _id: userId }, { $push: { boughtTrips: billFromDb._id }, $set: { "fullinfo.phone": bill.userInfo.phone, "fullinfo.fullname": bill.userInfo.fullname } }) }
    },
    async payTinkoffBill({ billId, tinkoffData }) {
        return BillModel.findByIdAndUpdate(billId, { tinkoff: tinkoffData })
    },
    async insertOne(trip) {
        return TripModel.create(trip)
    },
    async updateOne(trip) {
        let _id = trip._id
        delete trip._id

        let oldTrip = await TripModel.findById(_id)
        trip.startLocation = await LocationService.createLocation(trip.startLocation)
        trip.locationNames[0] = trip.startLocation
        trip.includedLocations.coordinates[0] = trip.startLocation.coordinates

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
    async deleteOne(_id, s3) {
        let tripToDelete = await TripModel.findById(_id)
        if (tripToDelete) {
            // if bought by user
            if (tripToDelete.billsList.length > 0) {
                throw ApiError.BadRequest('Нельзя удалять купленные туры')
            }
            let childrenIds = []
            for (let ch of tripToDelete.children) {
                await TripModel.findByIdAndDelete(ch)
                // если так не сделать, то вместо String получаем new ObjectId("64ba6635a5f641523c785c55")
                childrenIds.push(ch.toString())
            }
            await UserModel.findByIdAndUpdate(tripToDelete.author, {
                $pull: { trips: { $in: [_id, ...childrenIds] } }
            })

            if (tripToDelete.parent) {
                await TripModel.findByIdAndUpdate(tripToDelete.parent, { $pull: { children: { _id: tripToDelete._id } } })
            }

            let images = tripToDelete.images
            // multer.deleteImages(images)
            for (let image of images) {
                let s = image.split('/')
                let filename = s[s.length - 1]

                let remove = await s3.Remove('/iwat/' + filename)
            }

            return tripToDelete.remove()
        }
        return null
    },
    async findMany(sitePage, lon, lat, strQuery, start, end, tripType, tripRegion, locationRadius) {
        const limit = 20;
        const page = sitePage || 1;
        const skip = (page - 1) * limit;
        let query = {}

        // geo $near must be top-level expr
        query = {
            $and: [

                { isHidden: false, isModerated: true, rejected: false },
                { "parent": { $exists: false } },
            ]
        }
        if (lat && lon) {
            query.$and.push({
                includedLocations: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [Number(lon), Number(lat)]
                        },
                        // in meters
                        $maxDistance: locationRadius
                    }
                }
            })
        }
        if (start && end) {
            query.$and.push({
                $or: [
                    {
                        // всё, что относится к родителю
                        $and: [
                            { 'start': { $gte: start } },
                            { 'end': { $lte: end } },
                        ]
                    },
                    // все, что относится к children
                    {
                        children: {
                            $elemMatch:
                            {
                                $and: [
                                    { 'start': { $gte: start } },
                                    { 'end': { $lte: end } },
                                ]
                            }
                        }
                    }
                ]
            })
        } else {
            query.$and.push({
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
            })
        }

        // когда есть регион - используем (да, региона может не быть,
        // так как мы не только в одном месте этот метод используем)
        if (tripRegion && strQuery) {
            query.$and.push(
                {
                    $or: [
                        { tripRegion: { $eq: tripRegion } },
                        { name: { $regex: strQuery, $options: 'i' } },
                        // { tripRoute: { $regex: strQuery, $options: 'i' } },
                        // { offer: { $regex: strQuery, $options: 'i' } },
                        // { description: { $regex: strQuery, $options: 'i' } },
                    ]
                }
            )
        }
        // вдруг мы каким-то образом посеяли strQuery
        else if (tripRegion && !strQuery) {
            query.$and.push(
                {
                    tripRegion: { $eq: tripRegion } // важно
                }
            )
        }
        // Региона может не быть, так как мы не только в одном месте этот метод используем)
        else if (!tripRegion && strQuery) {
            query.$and.push(
                {
                    $or: [
                        // важно
                        { name: { $regex: strQuery, $options: 'i' } },
                        { tripRoute: { $regex: strQuery, $options: 'i' } },
                        { offer: { $regex: strQuery, $options: 'i' } },
                        { description: { $regex: strQuery, $options: 'i' } },
                    ]
                }
            )
        }

        if (tripType) {
            query.$and.push(
                {

                    tripType: { $regex: tripType, $options: 'i' },

                }
            )
        }
        const cursor = TripModel.find(query, null, { sort: 'start' }).skip(skip).limit(limit).cursor();

        const results = [];
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            results.push(doc);
        }

        let sortedByDateResults = _.sortBy(results, function (trip) {
            if (trip.children.length > 0 && trip.start < Date.now()) {
                for (let ch of trip.children) {
                    if (ch.start >= Date.now())
                        return ch.start
                }
            }
            return trip.start
        })

        return sortedByDateResults
    },
    async findForSearch(s, cursor) {
        const { query, when } = s

        // если пустой фильтр
        if (!query && !when.start) {
            return await TripModel.find({ isHidden: false, isModerated: true, rejected: false })
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
                    isHidden: false, isModerated: true, rejected: false
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
            { rejected: false },
            { "parent": { $exists: false } }]
        }).populate('author', { 'fullinfo.fullname': 1 }).sort({ 'createdDay': -1 })
    },
    async findRejectedTrips() {
        return TripModel.find({
            $and: [{ rejected: true },
            { "parent": { $exists: false } }]
        }).populate('author', { 'fullinfo.fullname': 1 })
    },
    async moderate(_id, t) {
        return TripModel.findByIdAndUpdate(_id, { isModerated: t, rejected: false })
    },
    async sendModerationMessage(tripId, msg) {
        return TripModel.findByIdAndUpdate(tripId, { isModerated: false, moderationMessage: msg, rejected: true })
    },
    async findById(_id) {
        return TripModel.findById(_id).populate('author').populate('places', { name: 1 })
    },
    async createdTripsInfo(_id) {
        let tripsIdArray = []


        await UserModel.findById(_id, { "trips": 1 }).then(data => {
            tripsIdArray = data.trips
        })
        let result = []
        await TripModel.find({ _id: { $in: tripsIdArray } }).populate('parent').populate('calculator')
            .then((data) => {

                for (let trip of data) {
                    if (trip.parent) {
                        // let originalId = trip._id
                        // let parentId = trip.parent._id
                        // let { start, end } = trip
                        // let isModerated = trip.parent.isModerated

                        // Object.assign(trip, trip.parent)
                        // trip.parent = parentId
                        // trip.children = []
                        // trip._id = originalId
                        // trip.start = start
                        // trip.end = end
                        // trip.isModerated = isModerated
                        trip.name = trip.parent.name
                        trip.description = trip.parent.description
                        trip.tripRoute = trip.parent.tripRoute
                        trip.tripType = trip.parent.tripType
                        trip.startLocation = trip.parent.startLocation
                        trip.partner = trip.parent.partner
                        trip.offer = trip.parent.offer
                        trip.parent.isModerated ? trip.isModerated = true : trip.isModerated = false
                        result.push(trip)
                    } else {
                        result.push(trip)
                    }

                }
                tripsInfoArray = result
            })

        return result
    },
    async updateBillsTourists({ _id, touristsList }) {
        // console.log(_id, touristsList)
        let bill = await BillModel.findById(_id)
        bill.touristsList = touristsList
        return bill.save()
    },
    async updatePartner({ partner, _id, canSellPartnerTour }) {
        return TripModel.findByIdAndUpdate(_id, { partner: partner, canSellPartnerTour: canSellPartnerTour })
    },
    async updateIncludedLocations({ newLocation, locationsToDelete, tripId }) {
        if (newLocation) {
            let locFromDb = await LocationService.createLocation(newLocation)
            let trip = await TripModel.findByIdAndUpdate(tripId, { $push: { 'includedLocations.coordinates': locFromDb.coordinates, 'locationNames': locFromDb } })
        }
        if (locationsToDelete) {
            let trip = await TripModel.findById(tripId)
            for (let i = 0; i < trip.locationNames.length; i++) {
                for (let _id of locationsToDelete) {
                    if (trip.locationNames[i]._id == _id) {
                        let indexToDelete;
                        for (let j = 0; j < trip.includedLocations.coordinates.length; j++) {
                            if (trip.includedLocations.coordinates[j][0] == trip.locationNames[i].coordinates[0] && trip.includedLocations.coordinates[j][1] == trip.locationNames[i].coordinates[1])
                                indexToDelete = j
                        }
                        if (indexToDelete) {
                            trip.includedLocations.coordinates.splice(indexToDelete, 1)
                            trip.locationNames.splice(i, 1)
                        }
                    }
                }
            }
            trip.markModified('includedLocations.coordinates')
            trip.markModified('locationNames')
            await trip.save()

            let de = await LocationModel.deleteMany({ _id: { $in: locationsToDelete } })
        }
        return 'ok'
    },
    async updateTransports({ tripId, newTransport, transportToDelete }) {
        let tripFromDb = await TripModel.findById(tripId)
        for (let i = 0; i < tripFromDb.transports.length; i++) {
            for (let nameToDelete of transportToDelete) {
                if (tripFromDb.transports[i].transportType.name == nameToDelete) {
                    tripFromDb.transports.splice(i, 1)
                }
            }
        }
        if (newTransport) {
            for (let tr of tripFromDb.transports) {
                tr.price = newTransport.price
            }
            tripFromDb.transports.push(newTransport)
            tripFromDb.markModified('transports.capacity')
        }
        return await tripFromDb.save()
    },
    async findTripsByName({ name: name, userId: userId }) {

        let tempTrips = await BillModel.find({ 'touristsList.fullname': { $regex: name, $options: 'i' } }, { tripId: 1 })
        let clearTrips = tempTrips.map((trip) => { return trip.tripId })
        let trips = await TripModel.find({ _id: clearTrips, author: userId }, { name: 1, start: 1, end: 1, author: 1 })
        return trips
    },
    async setUserComment({ tripId, comment }) {
        return await TripModel.findByIdAndUpdate(tripId, { $set: { userComment: comment } })
    },
    async editBillUserComment({ billId, comment }) {
        return await BillModel.findByIdAndUpdate(billId, { $set: { userComment: comment } })
    },
    async getBoughtTrips(userId) {
        let userFromDb = await UserModel.findById(userId).populate('boughtTrips').populate({
            path: 'boughtTrips',
            populate: {
                path: 'tripId',
                model: 'Trip'
            },

        })
        return userFromDb.boughtTrips
    },
    async findAuthorTrips({ query, _id }) {
        let trips = await TripModel.find({
            author: _id,
            name: { $regex: query, $options: 'i' },
            'start': { $gte: Date.now() }
        }, { name: 1, timezoneOffset: 1, end: 1, })
        return trips
    },
}