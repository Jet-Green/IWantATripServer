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
            let candidate = await ExcursionDateModel.findOne({ times: { $elemMatch: { _id: timeId } } })
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
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0); // Обнуляем время для корректного сравнения
        currentDate.setDate(currentDate.getDate() - 3); // Минус 3 дня

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

    async getAll(body) {
        const locationId = body.locationId
        const limit = 1000
        const page = body.cursor || 1;
        const skip = (page - 1) * limit;

        const {
            start,
            end,
            query: search,
            type,
            directionType,
            directionPlace,
            minAge,
            havePrices,
            withTimes
        } = body.filter


        let currentDate = new Date();

        let currentYear = currentDate.getFullYear();
        let currentMonth = currentDate.getMonth(); // месяцы в JS начинаются с 0
        let currentDay = currentDate.getDate();


        if (start) {
            currentDate = new Date(start);
            currentYear = currentDate.getFullYear();
            currentMonth = currentDate.getMonth();
            currentDay = currentDate.getDate();
        }
        let endYear
        let endMonth
        let endDay

        if (end) {
            const endDate = new Date(end);
            endYear = endDate.getFullYear();
            endMonth = endDate.getMonth();
            endDay = endDate.getDate();
        }


        const dateQuery = {
            $and: []
        }; 
        // sus filter
        // Нижняя граница: >= current  
        dateQuery.$and.push({
            $or: [
                { 'date.year': { $gt: currentYear } },
                {
                    'date.year': currentYear,
                    $or: [
                        { 'date.month': { $gt: currentMonth } },
                        {
                            'date.month': currentMonth,
                            'date.day': { $gte: currentDay },
                        },
                    ],
                },
            ],
        });

        // Верхняя граница: <= end (если определена)
        if (end) {
            dateQuery.$and.push({
                $or: [
                    { 'date.year': { $lt: endYear } },
                    {
                        'date.year': endYear,
                        $or: [
                            { 'date.month': { $lt: endMonth } },
                            {
                                'date.month': endMonth,
                                'date.day': { $lte: endDay },
                            },
                        ],
                    },
                ],
            });
        }

        const validDateIds = await ExcursionDateModel.find(dateQuery, { _id: 1 }).lean();

        const validIds = validDateIds.map(d => d._id);



        let query = {}

        query = {
            $and: [
                { isHidden: false, isModerated: true, },
            ]
        }

        if (locationId) {
          try {
            const location = await LocationModel.findById(locationId);
            if (location?.coordinates) {
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
            }
          } catch (error) {
            console.error('Location search error:', error);
            throw new Error('Failed to process location filter');
          }
        }

        if (search) {
            query.$and.push(
                {
                    $or: [
                        { name: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } },
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
      
        // Age filter
        if (minAge) {
          query.$and.push({ minAge: { $lte: minAge } });
        }
      
        // Price availability filter
        if (havePrices) {
            query.$and.push(
                {
                    prices: { $size: 0 },
                }
            )
        }
        switch (withTimes) {
            case 'с датами':
                query.$and.push(
                    { 'dates.0': { $exists: true } },
                    { dates: { $in: validIds } }
                );
                break;
            case 'для заказа':
                query.$and.push({
                    $or: [
                        { 'dates.0': { $exists: false } },
                        { dates: { $nin: validIds } }
                    ]
                });
                break;
            default:
                break;
        }


        const result = await ExcursionModel.find(query)
            .populate('dates')
            .skip(skip)
            .limit(limit)
        return result
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
    async buyWithTinkoff({ bill }) {
        delete bill.userInfo.author
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
    async buy({ timeId, toSend, fullinfo, userId }) {
        delete fullinfo.time
        delete fullinfo.date
        delete fullinfo.author
        delete fullinfo.name
        let billFromDb = await ExcursionBillModel.create({ time: timeId, user: userId, cart: toSend, userInfo: fullinfo })
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
    },
    async getVisibleExcursionIds() {
        const items = await ExcursionModel.find({ isHidden: false, isModerated: true })
        return items.map(p => p._id.toString());
    }
}