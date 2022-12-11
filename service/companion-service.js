const СompanionModel = require('../models/companion-model');

module.exports = {
    insertOne(companion) {
        return СompanionModel.create(companion)
    },
    findById(_id) {
        return СompanionModel.findById(_id)
    },
    findMany() {
        return СompanionModel.find({}).exec()
    },
}