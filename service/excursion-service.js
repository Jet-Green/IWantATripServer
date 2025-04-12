const ExcursionModel = require('../models/excursion-model.js')
const UserModel = require('../models/user-model.js')
const ExcursionDateModel = require('../models/excursion-date-model.js')
const ExcursionBillModel = require('../models/excursion-bill-model.js')
const LocationModel = require('../models/location-model.js')
const ExcursionBookingModel = require('../models/excursion-booking-model.js')
const _ = require('lodash')
const { sendMail } = require('../middleware/mailer')

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
            let candidate = await ExcursionDateModel.findOne( { times: { $elemMatch: { _id: timeId } }  })
            if (candidate?._id) {
                let populatedDate = await candidate.populate({
                    path: 'times.bills',
                    model: 'ExcursionBill',
                    select: {
                        cart: 1,
                        user: 1,
                        userInfo: 1,
                        tinkoff: 1
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
        const currentDate = new Date();
      
        let excursion = await ExcursionModel.findById(excursionId)
            .select({ name: 1, dates: 1, bookings: 1 })
            .populate(
                {
                    path: 'dates',
                    model: 'ExcursionDate',
                    populate: {
                        path: 'times.bills',
                        model: 'ExcursionBill',
                        select: { cart: 1 }
                    },
                },
            )
            .populate(
                {
                    path: 'bookings',
                    model: 'ExcursionBooking',
                    select: {
                        time: 1,
                        count: 1
                    }
                },
            )

         // Filter dates that are in the future
         const filteredDates = excursion.dates.filter(date => {
            const excursionDate = new Date(date.date.year, date.date.month, date.date.day);
            return excursionDate >= currentDate;
        });
       
        const sortedDates = _.sortBy(filteredDates, ['date.year', 'date.month', 'date.day']);
        // Создаем новый объект для возврата
        const excursionToReturn = {
            ...excursion.toObject(),
            dates: sortedDates
        };
        return excursionToReturn;


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
        let excursionFromDb = await ExcursionModel.findById(_id)
        excursionFromDb.images.push(...filenames)
        return excursionFromDb.save()
    },
    async getByUserId(userId) {
        const userFromDb = await UserModel.findById(userId)
        return await ExcursionModel.find({ _id: { $in: userFromDb.excursions } })
    },
    async getById(_id) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // месяцы в JS начинаются с 0
        const currentDay = currentDate.getDate();

        let excursion = await ExcursionModel.findById(_id).populate('dates')

        const filteredDates = excursion.dates.filter(date => {

            return date.date.year >= currentYear && date.date.month >= currentMonth && date.date.day >= currentDay

        });

        // Создаем новый объект для возврата
        const excursionToReturn = {
            ...excursion.toObject(),
            dates: filteredDates
        };
        return excursionToReturn;
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

    async getAll(locationId, strQuery, start, end, type, directionType, directionPlace, minAge, havePrices) {
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth(); // месяцы в JS начинаются с 0
        const currentDay = currentDate.getDate();
        let upcomingDates = ""
        if (start && end) {
            start = new Date(start)
            end = new Date(end)
            upcomingDates = await ExcursionDateModel.find({
                $and: [
                    {
                        $or: [
                            { 'date.year': { $gt: start.getFullYear(), $lt: end.getFullYear() } },
                            {
                                $and: [
                                    { 'date.year': { $eq: start.getFullYear(), $ne: end.getFullYear() } },
                                    { 'date.month': { $gte: start.getMonth() } }
                                ]
                            },
                            {
                                $and: [
                                    { 'date.year': { $ne: start.getFullYear(), $eq: end.getFullYear() } },
                                    { 'date.month': { $lte: end.getMonth() } }
                                ]
                            },
                            { 'date.month': { $gte: start.getMonth(), $lte: end.getMonth() } },
                        ]
                    },
                    {
                        $or: [
                            { 'date.month': { $gt: start.getMonth(), $lt: end.getMonth() } },
                            {
                                $and: [
                                    { 'date.month': { $eq: start.getMonth(), $ne: end.getMonth() } },
                                    { 'date.day': { $gte: start.getDate() } }
                                ]
                            },
                            {
                                $and: [
                                    { 'date.month': { $ne: start.getMonth(), $eq: end.getMonth() } },
                                    { 'date.day': { $lte: end.getDate() } }
                                ]
                            },
                            { 'date.day': { $gte: start.getDate(), $lte: end.getDate() } }
                        ]
                    }
                ]
            }).select('_id');
        }
        else {
            upcomingDates = await ExcursionDateModel.find({
                $and: [
                    {
                        $or: [
                            { 'date.year': { $gt: currentYear } },
                            {
                                $and: [
                                    { 'date.year': currentYear },
                                    { 'date.month': { $gte: currentMonth } }
                                ]
                            }
                        ]
                    },
                    {
                        $or: [
                            { 'date.month': { $gt: currentMonth } },
                            {
                                $and: [
                                    { 'date.month': currentMonth },
                                    { 'date.day': { $gte: currentDay } }
                                ]
                            }
                        ]
                    },
                ]

            }).select('_id');
        }




        // Получаем только идентификаторы
        const upcomingDateIds = upcomingDates.map(date => date._id);
        let query = {}

        query = {
            $and: [
                { isHidden: false, isModerated: true, },
                {
                    $or: [
                        { dates: { $elemMatch: { $in: upcomingDateIds } } },
                        { dates: { $size: 0 } }
                    ]
                }
            ]
        }

        if (locationId) {
            let location = await LocationModel.findById(locationId)
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
                    "excursionType.directionType": { $regex: directionType, $options: 'i' },
                    "excursionType.directionPlace": { $regex: directionPlace, $options: 'i' },
                }
            )
        }
        if (minAge) {
            query.$and.push(
                {
                    minAge: { $lte: minAge },
                }
            )
        }
        if (havePrices) {
            query.$and.push(
                {
                    prices: { $size: 0 },
                }
            )
        }


        return await ExcursionModel.find(
            query

        ).populate('dates')

    },

    async getExcursionById(_id) {
       
        const currentDate = new Date();
    

        let excursion = await ExcursionModel.findById(_id).populate('dates')

        // Correctly filter dates to include only upcoming dates
        const filteredDates = excursion.dates.filter(date => {
            const excursionDate = new Date(date.date.year, date.date.month, date.date.day);
            return excursionDate >= currentDate;
        });

        // Создаем новый объект для возврата
        const excursionToReturn = {
            ...excursion.toObject(),
            dates: filteredDates
        };

        return excursionToReturn;

    },
    async deleteById(_id) {

        return ExcursionModel.findByIdAndDelete(_id)
    },
    async hideById(_id, isHide) {
        return await ExcursionModel.findByIdAndUpdate(_id, { isHidden: isHide })
    },
    async comment(_id, comment) {
    
        return await ExcursionModel.findByIdAndUpdate(_id, { comment: comment })
    },

    
    /**
     * email html
     * @param {String} emailHtml 
     * bill with tinkoff field
     * @param {Object} bill 
     */
    async buyWithTinkoff({ emailHtml, bill }) {
        let billFromDb = await ExcursionBillModel.create(bill)
        const timeId = bill.time
        let exDateFromDb = await ExcursionDateModel.findOne({ times: { $elemMatch: { _id: timeId } } })
        for (let i = 0; i < exDateFromDb.times.length; i++) {
            if (exDateFromDb.times[i]._id == timeId) {
                exDateFromDb.times[i].bills.push(billFromDb._id)
                break
            }
        }
        exDateFromDb.markModified('times')
        await exDateFromDb.save()
        return billFromDb
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
    async buyFromCabinet({ timeId, bill, fullinfo }) {
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
    async deleteBooking(_id) {

        // await ExcursionDateModel.updateMany(
        //  { 'times.bills': _id },
        //  { $pull: { 'times.$.bills': _id } },
        //  { multi: true, new: true }  // Возвращает обновленный документ
        //  );
        return await ExcursionBookingModel.findByIdAndDelete(_id)
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
    async order(req) {
        return await ExcursionModel.findByIdAndUpdate(req.excursionId, { $push: { orders: req.fullinfo } })
    },
    async edit({ excursion }) {
        let _id = excursion._id
        delete excursion._id
        excursion.isModerated = false
        return await ExcursionModel.findByIdAndUpdate(_id, excursion)
    }
}