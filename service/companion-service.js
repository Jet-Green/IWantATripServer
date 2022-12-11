const СompanionModel = require('../models/companion-model');

module.exports = {
    async insertOne(companion) {
        return СompanionModel.create(companion)
 // надо добавить юзеру информацию о созданных заявках в попутчики
    },
    async findMany() {
        return СompanionModel.find({}).exec()
    },
}