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
        // если найден тип, то его индекс тоже сохранится
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
                        if (doc.excursionTypes[i].direction[j].directionPlace == directionPlace) {
                            directionPlaceFound = true
                        }
                    }
                }
            }
        }
        console.log(typeFound, directionTypeFound, directionPlaceFound);
        if (typeFound) {
            if (directionTypeFound) {
                if (directionPlaceFound) return
                else {
                    doc.excursionTypes[typeIndex].direction[directionTypeIndex].directionPlace = directionPlace
                }
            } else {
                doc.excursionTypes[typeIndex].direction.push({ directionType, directionPlace })
            }
        } else {
            doc.excursionTypes = { type: type, direction: [{ directionType, directionPlace }] }
        }
        console.log(doc.excursionTypes);
        doc.markModified('excursionTypes')
        return await doc.save()
    }
}