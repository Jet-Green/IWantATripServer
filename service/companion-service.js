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
    async addFeedback(feedback, companionId) {
        return await СompanionModel.findByIdAndUpdate(companionId, { $push: { companionRequests: feedback } })
    },
    async deleteMany() {
        return СompanionModel.deleteMany({})
    },
}