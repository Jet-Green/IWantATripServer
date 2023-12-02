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
        return AppStateModel.findOneAndUpdate({}, { $pull: { 'mainPageMesssages': index } })
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
}