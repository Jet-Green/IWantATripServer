const AppStateModel = require('../models/app-state-model')

module.exports = {
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
    }
}