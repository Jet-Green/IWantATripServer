const AppStateModel = require('../models/app-state-model')
const BookingModel = require('../models/booking-model')
const CompanionModel = require('../models/companion-model')
const GuideElementModel = require('../models/guide-element-model')
const TokenModel = require('../models/token-model')
const UserModel = require('../models/user-model')
const TripModel = require('../models/trip-model')

module.exports = {
    deleteTripType(name) {
        return AppStateModel.findOneAndUpdate({}, { $pull: { 'tripType': name } })
    },
    deleteTransportName(name) {
        return AppStateModel.findOneAndUpdate({}, { $pull: { 'transport': name } })
    },

    getState() {
        return AppStateModel.find({})
    },
    update(newState) {
        return AppStateModel.updateOne({}, { $set: newState })
    },
    createState() {
        return AppStateModel.create({})
    },
    deleteMPMById(index) {
        return AppStateModel.findOneAndUpdate({}, { $pull: { 'mainPageMessage': index } })
    },
    async dropDatabase() {
        await BookingModel.deleteMany({})
        await CompanionModel.deleteMany({})
        await GuideElementModel.deleteMany({})
        await TokenModel.deleteMany({})
        await UserModel.deleteMany({})
        await TripModel.deleteMany({})
        return 'ok'
    },

    setTripType(type) {
        return AppStateModel.updateOne({}, { $push: { tripType: type } })
    },
    setTransportName(type) {
        return AppStateModel.updateOne({}, { $push: { transport: type } })
    },
    async updateExcursionTypes({ type, directionType, directionPlace }) {
        let doc = await AppStateModel.findOne({})
        // если найден тип, то его индекс тоже найден
        let typeFound = false;
        let typeIndex = -1;
        let directionTypeFound = false;
        let directionTypeIndex = -1;
        let directionPlaceFound = false;

        for (let i = 0; i < doc.excursionTypes.length; i++) {
            if (doc.excursionTypes[i].type == type) {
                typeFound = true;
                typeIndex = i;
                for (let j = 0; j < doc.excursionTypes[i].direction.length; j++) {
                    if (doc.excursionTypes[i].direction[j].directionType == directionType) {
                        directionTypeFound = true;
                        directionTypeIndex = j;
                        for (let k = 0; k < doc.excursionTypes[i].direction[j].directionPlace.length; k++) {
                            if (doc.excursionTypes[i].direction[j].directionPlace[k] == directionPlace) {
                                directionPlaceFound = true
                                break
                            }
                        }
                    }
                }
            }
        }

        if (typeFound) {
            if (directionTypeFound) {
                if (directionPlaceFound) return
                doc.excursionTypes[typeIndex].direction[directionTypeIndex].directionPlace.push(directionPlace)
            } else {
                if (directionPlace?.length > 0) {
                    doc.excursionTypes[typeIndex].direction.push({
                        directionType,
                        directionPlace: [directionPlace]
                    })
                } else {
                    doc.excursionTypes[typeIndex].direction.push({
                        directionType,
                        directionPlace: []
                    })
                }
            }
        } else {
            let toAdd = { type, direction: [] }
            if (directionType?.length > 0) {
                toAdd.direction.push({ directionType, directionPlace: [] })
            }
            // чтобы не добавить в несуществующий directionPlace
            if (directionPlace?.length > 0 && directionType?.length > 0) {
                toAdd.direction[0].directionPlace.push(directionPlace)
            }
            doc.excursionTypes.push(toAdd)
        }

        doc.markModified('excursionTypes')
        return await doc.save()
    },
    async deleteExcursionType(body) {
        let doc = await AppStateModel.findOne({})
        if (body.type) {
            for (let i = 0; i < doc.excursionTypes.length; i++) {
                if (doc.excursionTypes[i].type == body.type) {
                    doc.excursionTypes.splice(i, 1)
                    doc.markModified('excursionTypes')
                    return await doc.save()
                }
            }
        } else if (body.directionType) {
            for (let i = 0; i < doc.excursionTypes.length; i++) {
                for (let j = 0; j < doc.excursionTypes[i].direction.length; j++) {
                    if (doc.excursionTypes[i].direction[j].directionType == body.directionType) {
                        doc.excursionTypes[i].direction.splice(j, 1)
                        doc.markModified('excursionTypes')
                        return await doc.save()
                    }
                }
            }
        } else if (body.directionPlace) {
            for (let i = 0; i < doc.excursionTypes.length; i++) {
                for (let j = 0; j < doc.excursionTypes[i].direction.length; j++) {
                    for (let k = 0; k < doc.excursionTypes[i].direction[j].directionPlace.length; k++) {
                        if (doc.excursionTypes[i].direction[j].directionPlace[k] == body.directionPlace) {
                            doc.excursionTypes[i].direction[j].directionPlace.splice(k, 1)
                            doc.markModified('excursionTypes')
                            return await doc.save()
                        }
                    }
                }
            }
        }
        return 'ok'
    },
    addTripRegion(tripRegion) {
        return AppStateModel.updateOne({}, { $push: { tripRegions: tripRegion } })
    },
    async deleteTripRegion(tripRegion) {
        let appStateFromDb = await AppStateModel.findOne({})
        for (let i = 0; i < appStateFromDb.tripRegions.length; i++) {
            if (appStateFromDb.tripRegions[i] == tripRegion) {
                appStateFromDb.tripRegions.splice(i, 1)
            }
        }
        
        appStateFromDb.markModified('tripRegions')
        return appStateFromDb.save()
    },
}