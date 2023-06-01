const СompanionModel = require('../models/companion-model');

module.exports = {
    insertOne(companion) {
        return СompanionModel.create(companion)
    },
    findById(_id) {
        return СompanionModel.findById(_id)
    },
    async findMany(sitePage, lon, lat) {
        const limit = 20;
        const page = sitePage || 1;
        const skip = (page - 1) * limit;
        let query = {
            $and: [
                { start: { $gt: Date.now() } },
                { isHidden: false, isModerated: true },

            ]
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

        const cursor = CompanionModel.find(query, null, { sort: 'start' }).skip(skip).limit(limit).cursor();

        const results = [];
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            results.push(doc);
        }

        return results
    },
    async findForSearch(s) {
        const { find,
            gender,
            age,
            end,
            start
        } = s.query
        // если пустой фильтр
        if (!find && !gender && !age.start && !age.end && !end && !start) {
            return await СompanionModel.find({})
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
        return СompanionModel.find(filter);

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