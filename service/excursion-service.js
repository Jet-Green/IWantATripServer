const ExcursionModel = require('../models/excursion-model.js')
const UserModel = require('../models/user-model.js')
const ExcursionDateModel = require('../models/excursion-date-model.js')
const ExcursionBillModel = require('../models/excursion-bill-model.js')

module.exports = {
    async create({ excursion, userId }) {
        let exFromDb = await ExcursionModel.create(excursion)
        await UserModel.findByIdAndUpdate(userId, { $push: { excursions: exFromDb._id } })
        return exFromDb
    },
    async updateImagesUrls(_id, filenames) {
        return ExcursionModel.findByIdAndUpdate(_id, { $set: { images: filenames } })
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
        await ExcursionModel.findByIdAndUpdate(excursionId, { $push: { dates: { $each: created } } })
        return await UserModel.findByIdAndUpdate(userId, { $push: { excursionDates: { $each: created } } })
    },

    async deleteTime({ dateId, timeId }) {
        return await ExcursionDateModel.findByIdAndUpdate(
            dateId,
            { $pull: { times: { _id: timeId } } },
            { new: true } // Возвращает обновленный документ
        );

    },
    async deleteDate({ dateId, userId }) {
        await UserModel.findByIdAndUpdate(userId, { $pull: { excursionDates: dateId } })
        return await ExcursionDateModel.findByIdAndDelete(
            dateId
        );

    },

    async getAll() {
        return await ExcursionModel.find(
            // filters here
        )
    },

    async fetchExcursions(sitePage, lon, lat, strQuery, start, end, tripType) {
        const limit = 20;
        const page = sitePage || 1;
        const skip = (page - 1) * limit;
        let query = {}

        // geo $near must be top-level expr
        query = {
            $and: [

                { isHidden: false, isModerated: true, rejected: false },
                { "parent": { $exists: false } },
            ]
        }
        if (lat && lon) {
            query.$and.push({
                includedLocations: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [Number(lon), Number(lat)]
                        },
                        // 50 km
                        $maxDistance: 50000
                    }
                }
            })
        }
        if (start && end) {
            query.$and.push({
                $or: [
                    {
                        // всё, что относится к родителю
                        $and: [
                            { 'start': { $gte: start } },
                            { 'end': { $lte: end } },
                        ]
                    },
                    // все, что относится к children
                    {
                        children: {
                            $elemMatch:
                            {
                                $and: [
                                    { 'start': { $gte: start } },
                                    { 'end': { $lte: end } },
                                ]
                            }
                        }
                    }
                ]
            })
        } else {
            query.$and.push({
                $or: [
                    {
                        // всё, что относится к родителю
                        $and: [
                            { 'start': { $gte: Date.now() } },
                        ]
                    },
                    // все, что относится к children
                    {
                        children: {
                            $elemMatch: {
                                start: { $gte: Date.now() },
                            }
                        }
                    }
                ]
            })
        }
        if (strQuery) {
            query.$and.push(
                {
                    $or: [
                        { name: { $regex: strQuery, $options: 'i' } },
                        { tripRoute: { $regex: strQuery, $options: 'i' } },
                        { offer: { $regex: strQuery, $options: 'i' } },
                        { description: { $regex: strQuery, $options: 'i' } },
                    ]
                }
            )
        }
        if (tripType) {
            query.$and.push(
                {

                    tripType: { $regex: tripType, $options: 'i' },

                }
            )
        }

        const cursor = ExcursionModel.find(query, null, { sort: 'start' }).skip(skip).limit(limit).cursor();

        const results = [];
        for (let doc = await cursor.next(); doc != null; doc = await cursor.next()) {
            results.push(doc);
        }

        let sortedByDateResults = _.sortBy(results, function (excursion) {
            if (excursion.children.length > 0 && excursion.start < Date.now()) {
                for (let ch of excursion.children) {
                    if (ch.start >= Date.now())
                        return ch.start
                }
            }
            return excursion.start
        })

        return sortedByDateResults
    },

    async getExcursionById(_id) {
        return await ExcursionModel.findById(_id).populate('dates')
    },
    async deleteById(_id) {

        return ExcursionModel.findByIdAndDelete(_id)
    },
    async hideById(_id, isHide) {
        return await ExcursionModel.findByIdAndUpdate(_id, { isHidden: isHide })
    },
    async buy({ timeId, userId, bill }) {
        let billFromDb = await ExcursionBillModel.create({ time: timeId, userId, cart: bill })
        let exDateFromDb = await ExcursionDateModel.findOne({ times: { $elemMatch: { _id: timeId } } })
        for (let i = 0; i < exDateFromDb.times.length; i++) {
            if (exDateFromDb.times[i]._id == timeId) {
                exDateFromDb.times[i].bills.push(billFromDb._id)
                break
            }
        }
        exDateFromDb.markModified('times')
        return await exDateFromDb.save()
    },
    async getExcursionsOnModeration() {
        return await ExcursionModel.find({ isModerated: false }).populate('author', 'fullinfo').exec()
    },
    async deleteExcursion(_id) {
       // поставить защиту на удаление проданных экскурсий
        return await ExcursionModel.findByIdAndDelete(_id)
    },
    async approvExcursion(_id) {
        // поставить защиту на удаление проданных экскурсий
         return await ExcursionModel.findByIdAndUpdate(_id,{ isModerated: true })
     },

    
}