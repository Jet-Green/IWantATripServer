const ExcursionModel = require('../models/excursion-model.js')
const UserModel = require('../models/user-model.js')
const ExcursionDateModel = require('../models/excursion-date-model.js')
const ExcursionBillModel = require('../models/excursion-bill-model.js')
const LocationModel = require('../models/location-model.js')
const ExcursionBookingModel = require('../models/excursion-booking-model.js')

const LocationService = require('../service/location-service.js')
const excursionBillModel = require('../models/excursion-bill-model.js')

module.exports = {
    async getTimeBookings({ excursionId, timeId }) {
        let excursion = await ExcursionModel.findById(excursionId).select({ name: 1, dates: 1, bookings: 1 }).populate('dates').populate('bookings')
        let bookings = await ExcursionBookingModel.find({ time: { $eq: timeId } })
            .populate({ path: 'user', select: { fullinfo: 1 } })
        let timeToSend = {}
        for (let date of excursion.dates) {
            for (let time of date.times) {
                if (time._id == timeId) {
                    timeToSend = time
                    break
                }
            }
        }
        return { excursion, bookings, time: timeToSend }
    },
    async getTimeCustomers({ excursionId, timeId }) {
        let excursion = await ExcursionModel.findById(excursionId).populate('dates')
        let result = {
            excursion: {
                name: excursion.name,
                prices: excursion.prices,
                dates: excursion.dates
            },
            time: {}
        }
        for (let dateId of excursion.dates) {
            let candidate = await ExcursionDateModel.findOne({ $and: [{ id: dateId.toString() }, { times: { $elemMatch: { _id: timeId } } }] })
            if (candidate?._id) {
                let populatedDate = await candidate.populate({
                    path: 'times.bills',
                    model: 'ExcursionBill',
                    select: {
                        cart: 1,
                        user: 1,
                        userInfo: 1
                    },
                    populate: {
                        path: 'user',
                        model: 'User',
                        select: {
                            fullinfo: 1,
                        }
                    }
                })
                let foundTimes = populatedDate.times
                for (let t of foundTimes) {
                    if (t._id == timeId) {
                        result.time = t
                        break
                    }
                }
                if (result.time._id) break
            }
        }
        return result
    },
    async getWithBills(excursionId) {
        return await ExcursionModel.findById(excursionId)
            .select({ name: 1, dates: 1 })
            .populate({
                path: 'dates',
                model: 'ExcursionDate',
                populate: {
                    path: 'times.bills',
                    model: 'ExcursionBill',
                    select: { cart: 1 }
                }
            })
    },
    async getWithBookings(excursionId) {
        return await ExcursionModel.findById(excursionId).populate('bookings').populate('dates')
    },
    async create({ excursion, userId }) {
        await LocationService.createLocation(excursion.location)
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
            let exists = await ExcursionDateModel.exists({ date: date.date, excursion: excursionId })
            if (exists) continue

            let result = await ExcursionDateModel.create({ date: date.date, times: date.times, excursion: excursionId })
            created.push(result._id.toString())
        }
        await ExcursionModel.findByIdAndUpdate(excursionId, { $push: { dates: { $each: created } } })
        return await UserModel.findByIdAndUpdate(userId, { $push: { excursionDates: { $each: created } } })
    },

    async addTime({ date, time, excursionId }) {
        console.log(JSON.stringify({ date, time, excursionId }))
        let new_exursion_date = await ExcursionDateModel.findOneAndUpdate({ excursion: excursionId, date }, { $push: { times: time } }, { new: true })
        return new_exursion_date
    },

    async timeHasBills(timeId) {
        return (await excursionBillModel.find({ time: timeId })).length > 0
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

    async getAll(locationId,strQuery,start,end,type) {
        let query = {}
        function getDate(dateObj) {
            const dayjsDate = dayjs({ years: dateObj.year, months: dateObj.month, date: dateObj.day })
            if (!dayjsDate.$d) return ''
            let russianDate = (new Date(dayjsDate.$d)).toLocaleDateString('ru-RU', {
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            }).replaceAll(',', '').split(' ')
          
            return { weekday: russianDate[0], day: russianDate[1], month: russianDate[2] }
          }
          function getTime(timeObj) {
            let result = timeObj.hours + ':'
            if (timeObj.minutes < 10) {
              result += '0' + timeObj.minutes
            } else {
              result += timeObj.minutes
            }
            return result
          }
        query = {
            $and: [
                { isHidden: false, isModerated: true },
            ]
        }
        if (locationId) {
            let location = await LocationModel.findById(locationId)
            // query.$and.push({ location: locationId })
            if (location) {
                try {
                    query.$and.push({
                        'location.coordinates': {
                            $near: {
                                $geometry: {
                                    type: 'Point',
                                    coordinates: location.coordinates,
                                },
                                $maxDistance: 50000 // 50 km
                            }
                        }
                    });
                } catch (error) {
                    console.log(error);
                }
            } else {
                console.log('Координаты не найдены для данной локации');
            }

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
                        { description: { $regex: strQuery, $options: 'i' } },
                    ]
                }
            )
        }
        if (type) {
            query.$and.push(
                {

                    "excursionType.type": { $regex: type, $options: 'i' },

                }
            )
        }

        return await ExcursionModel.find(query
            // filters here
        )
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
        let billFromDb = await ExcursionBillModel.create({ time: timeId, user: userId, cart: bill })
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
    async buyFromCabinet({timeId, bill, fullinfo}) {
        let billFromDb = await ExcursionBillModel.create({ time: timeId, cart: bill, userInfo: fullinfo })
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
        // поставить защиту на удаление проданных экскурсий
        return await ExcursionModel.findByIdAndDelete(_id)
    },
    async deleteBill(_id) {
      
       await ExcursionDateModel.updateMany(
        { 'times.bills': _id },
        { $pull: { 'times.$.bills': _id } },
        { multi: true, new: true }  // Возвращает обновленный документ
        );
        return await ExcursionBillModel.findByIdAndDelete(_id)
    },


    async approvExcursion(_id) {
        // поставить защиту на удаление проданных экскурсий
        return await ExcursionModel.findByIdAndUpdate(_id, { isModerated: true })
    },
    async book(booking) {
        let bookingFromDb = await ExcursionBookingModel.create(booking)

        return await ExcursionModel.findByIdAndUpdate(bookingFromDb.excursion, { $push: { bookings: bookingFromDb._id } })
    },
    async bookFromCabinet(booking) {
        let bookingFromDb = await ExcursionBookingModel.create(booking)
        return await ExcursionModel.findByIdAndUpdate(bookingFromDb.excursion, { $push: { bookings: bookingFromDb._id } })
    },
    async edit({excursion}) {
        let _id = excursion._id
        delete excursion._id
        return await ExcursionModel.findByIdAndUpdate(_id, {})
    }
}