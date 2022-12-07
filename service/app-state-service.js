const AppStateModel = require('../models/app-state-model')

module.exports = {
    getState() {
        return AppStateModel.find({})
    },
    update(newState) {
        return AppStateModel.updateMany({}, { $set: newState })
    },
    createState() {
        return AppStateModel.create({})
    }
}