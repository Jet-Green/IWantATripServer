const ExcursionModel = require('../models/excursion-model.js')
const UserModel = require('../models/user-model.js')
const ExcursionDateModel = require('../models/excursion-date-model.js')

module.exports = {
    async create({ excursion, userId }) {
        let exFromDb = await ExcursionModel.create(excursion)
        return UserModel.findByIdAndUpdate(userId, { $push: { excursions: exFromDb._id } })
    },
    async getByUserId(userId) {
        const userFromDb = await UserModel.findById(userId)
        return await ExcursionModel.find({ _id: { $in: userFromDb.excursions } })
    },
    async getById(_id) {
        return await ExcursionModel.findById(_id)
    },
    async createDates({ dates, excursionId, userId }) {
        let created = []
        for (let date of dates) {
            let result = await ExcursionDateModel.create({ date: date.date, times: date.times, excursion: excursionId })
            created.push(result._id.toString())
        }
        return await UserModel.findByIdAndUpdate(userId, { $push: { excursionDates: { $each: created } } })
    }
}