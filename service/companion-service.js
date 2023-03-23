const СompanionModel = require('../models/companion-model');
const _ = require('lodash')

module.exports = {
    insertOne(companion) {
        return СompanionModel.create(companion)
    },
    findById(_id) {
        return СompanionModel.findById(_id)
    },
    async findMany(query, cursor, limit) {
        if (!query) {
            let companionsFromDB = await СompanionModel.find({}).limit(limit).skip(cursor)
            return companionsFromDB
        }
        if (query.find || query.gender || query.age || query.end || query.start) {
            return await this.filterCompanions(query, cursor, limit)
        }
        return СompanionModel.find({}).exec()
    },
    async filterCompanions(s, cursor, limit) {
        const { find,
            gender,
            age,
            end,
            start,
        } = s
        // если пустой фильтр
        if (!find && !gender && !age.start && !age.end && !end && !start) {
            let companionsFromDB = await СompanionModel.find({}).limit(limit).skip(cursor)
            return companionsFromDB
        }
        let filter = {
            $and: [
                {
                    $or: [
                        { name: { $regex: find, $options: 'i' } },
                        { surname: { $regex: find, $options: 'i' } },
                        { direction: { $regex: find, $options: 'i' } },
                        { description: { $regex: find, $options: 'i' } },
                    ]
                },

            ]
        }
        if (gender) {
            filter.$and.push({ gender: { $eq: gender } },)
        }
        if (age.start) {
            filter.$and.push({ age: { $gte: age.start } })
        }

        if (age.end) {
            filter.$and.push({ age: { $lte: age.end } })
        }
        if (start) {
            filter.$and.push({ start: { $gte: start } },
            )
        }
        if (end) {
            filter.$and.push({ end: { $lte: end } },
            )
        }
        return СompanionModel.find(filter).limit(limit).skip(cursor)

    },

    async deleteMany() {
        return СompanionModel.deleteMany({})
    },


    async addFeedback(feedback, companionId) {
        return await СompanionModel.findByIdAndUpdate(companionId, { $push: { companionRequests: feedback } })
    },
    async deleteMany() {
        return СompanionModel.deleteMany({})
    },
}