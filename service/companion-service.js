const СompanionModel = require('../models/companion-model');

module.exports = {
    async insertOne(companion) {
        return СompanionModel.create(companion)
    },
    async findMany() {
        return СompanionModel.find({}).exec()
    },
}