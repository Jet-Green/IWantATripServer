const ExcursionModel = require('../models/excursion-model.js')
const UserModel = require('../models/user-model.js')

module.exports = {
    async create({ excursion, userId }) {
        let exFromDb = await ExcursionModel.create(excursion)
        return UserModel.findByIdAndUpdate(userId, { $push: { excursions: exFromDb._id } })
    }
}