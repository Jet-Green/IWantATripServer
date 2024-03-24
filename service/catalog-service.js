const CatalogTripModel = require('../models/catalog-trip-model.js');

const ApiError = require('../exceptions/api-error.js')
const multer = require('../middleware/multer-middleware')

const { sendMail } = require('../middleware/mailer');

const LocationService = require('./location-service.js')

const _ = require('lodash');
const catalogTripModel = require('../models/catalog-trip-model.js');

module.exports = {
    async getFullCatalogById(_id) {
        let trip = await CatalogTripModel.findById(_id)
        return trip
    },
    async updateCatalogTripImagesUrls(_id, filenames) {
        const trip = await CatalogTripModel.findById(_id)
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
    async deleteOneCatalog(_id, s3) {
        let catalogTripToDelete = await CatalogTripModel.findById(_id)
        if (catalogTripToDelete) {
            // у userа нет поля с каталожными турами
            // await UserModel.findByIdAndUpdate(catalogTripToDelete.author, {
            //     $pull: { trips: { $in: _id } }
            // })

            let images = catalogTripToDelete.images
                // multer.deleteImages(images)
            for (let image of images) {
                let s = image.split('/')
                let filename = s[s.length - 1]

                let remove = await s3.Remove('/iwat/' + filename)
            }

            return catalogTripToDelete.remove()
        }
        return null
    },
    async hideCatalog(_id, v) {
        return CatalogTripModel.findByIdAndUpdate(_id, { isHidden: v })
    },
    async findCatalogTripsOnModeration() {
        return CatalogTripModel.find({
            $and: [{ isModerated: false },
                { rejected: false },
                { "parent": { $exists: false } }
            ]
        }).populate('author', { 'fullinfo.fullname': 1, 'fullinfo.phone': 1 }).sort({ 'createdDay': -1 })
    },
    async findRejectedCatalogTrips() {
        return CatalogTripModel.find({
            $and: [{ rejected: true },
                { "parent": { $exists: false } }
            ]
        }).populate('author', { 'fullinfo.fullname': 1, 'fullinfo.phone': 1 })
    },

    async getCatalogTrips(sitePage, lon, lat, strQuery, tripType) {
        const limit = 20;
        const page = sitePage || 1;
        const skip = (page - 1) * limit;
        let query = {}

        query = {
            $and: [

                { isHidden: false, rejected: false },
                { "parent": { $exists: false } },
            ]
        }

        if (lat && lon) {
            query.$and.push({
                startLocation: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [Number(lon), Number(lat)]
                        },
                        // 50 km
                        $maxDistance: 50000
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
        if (tripType) {
            query.$and.push({

                tripType: { $regex: tripType, $options: 'i' },

            })
        }

        const cursor = CatalogTripModel.find(query, null, { sort: 'start' }).skip(skip).limit(limit).cursor();
        const results = [];
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            results.push(doc);
        }
        return results
    },
    async moderateCatalog(_id, t) {
        return catalogTripModel.findByIdAndUpdate(_id, { isModerated: t, rejected: false })
    },
    async sendCatalogModerationMessage(tripId, msg) {
        return catalogTripModel.findByIdAndUpdate(tripId, { isModerated: false, moderationMessage: msg, rejected: true })
    },
    async getCatalogTripById(_id) {
        return await CatalogTripModel.findById(_id).populate({
            path: 'author',
            select: {
                fullinfo: 1
            }
        })
    },
    async moveToCatalog(_id) {
        let candidate = await TripModel.findById(_id)
        delete candidate._doc._id
        let toSave = Object.assign({}, candidate._doc)

        return CatalogTripModel.create(toSave)
    },
    async getMyCatalogTrips(id) {
        return await CatalogTripModel.find({ author: id, isModerated: true, rejected: false })
    },
    async myCatalogOnModeration(id) {
        return await CatalogTripModel.find({ author: id, isModerated: false })
    }
}