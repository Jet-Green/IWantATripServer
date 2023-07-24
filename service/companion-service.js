const СompanionModel = require('../models/companion-model');
const UserModel = require('../models/user-model');

module.exports = {
    insertOne(companion) {
        return СompanionModel.create(companion)
    },
    findById(_id) {
        return СompanionModel.findById(_id)
    },
    findMany(lon, lat, queryObj) {
        let query = {
            $and: [
                { isModerated: true },
            ]
        }
        let isEmptyObj = true
        for (let key in Object.keys(queryObj)) {
            // skip age, cuz its not eempty
            if (key == 'age') {
                if (queryObj[key].start !== '' || queryObj[key].end !== '') {
                    isEmptyObj = false
                }
                continue
            }

            if (queryObj[key] != '') {
                isEmptyObj = false
                break
            }
        }

        if (lon && lat) {
            query.$and.push({
                startLocation: {
                    $near: {
                        $geometry: {
                            type: 'Pointer',
                            coordinates: [Number(lon), Number(lat)]
                        },
                        // 100 km
                        $maxDistance: 100000
                    }
                }
            })
        }
        if (isEmptyObj) {
            if (!lon && !lat) {
                return СompanionModel.find({}, null)
            } else {
                return СompanionModel.find(query, null)
            }
        }
        if (queryObj.strQuery) {
            query.$and.push({
                $or: [
                    { name: { $regex: queryObj.strQuery, $options: 'i' } },
                    { surname: { $regex: queryObj.strQuery, $options: 'i' } },
                    { direction: { $regex: queryObj.strQuery, $options: 'i' } },
                    { description: { $regex: queryObj.strQuery, $options: 'i' } }
                ]
            })
        }
        if (queryObj.gender) {
            query.$and.push({ gender: { $eq: queryObj.gender } })
        }

        if (queryObj.start && queryObj.end) {
            query.$and.push(
                { start: { $gte: queryObj.start } },
                { end: { $lte: queryObj.end } }
            )
        }

        query.$and.push(
            { age: { $gte: Number(queryObj.age.start), $lte: Number(queryObj.age.end == 0 ? 100 : queryObj.age.end) } },
        )

        return СompanionModel.find(query, null)
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
    getCompanionsOnModeration() {
        return СompanionModel.find({ isModerated: false })
    },
    acceptCompanion(_id) {
        return СompanionModel.findByIdAndUpdate(_id, { $set: { isModerated: true } })
    },
    async deleteById(_id, userId) {
        await UserModel.findByIdAndUpdate(userId, { $pull: { createdCompanions: { $in: _id}}})
        return СompanionModel.findByIdAndDelete(_id)

    }
}