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
    async findForSearch(s) {
        const { find,
            gender,
            age,
            time } = s.query
         const start = time[0].toString()   
         const end = time[1].toString() 

        // если пустой фильтр
        if (!find && !gender && time.length && !age.start && !age.end) {
            return await СompanionModel.find({}.exec())
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
        if (time.length) {
            filter.$and.push({
                $and: [
                    { start: { $gte: start } },
                    { end: { $lte: end } },
                ]
            })
        }
        return СompanionModel.find(filter);

    },

    async deleteMany() {
        return СompanionModel.deleteMany({})
    },


}