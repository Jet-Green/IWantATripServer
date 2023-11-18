const BookingService = require('../service/booking-service')
const { sendMail } = require('../middleware/mailer')
const AppStateModel = require('../models/app-state-model')

module.exports = {
    async create(req, res, next) {
        try {
            const bookingCb = await BookingService.insertOne(req.body.booking)

            let eventEmails = await AppStateModel.findOne({ 'sendMailsTo.type': 'BookingTrip' }, { 'sendMailsTo.$': 1 })
            let emailsFromDb = eventEmails.sendMailsTo[0].emails

            sendMail(req.body.emailHtml, emailsFromDb, 'Заказана поездка')

            return res.json({ _id: bookingCb._id })
        } catch (err) {
            next(err)
        }
    },
    async findByUserId(req, res, next) {
        try {
            return res.json(await BookingService.findByUserId(req.body._id))
        } catch (error) {
            next(error)
        }
    },
    async getByStatus(req, res, next) {
        try {
            return res.json(await BookingService.getByStatus(req.query.status))
        } catch (error) {
            next(error)
        }
    },
    async changeStatus(req, res, next) {
        try {
            return res.json(await BookingService.changeStatus(req.query._id, req.query.status))
        } catch (error) {
            next(error)
        }
    },
    async updateBooking(req, res, next) {
        try {
            return res.json(await BookingService.updateBooking(req.body))
        } catch (error) {
            next(error)
        }
    },
    async offerTrip(req, res, next) {
        try {
            return res.json(await BookingService.offerTrip(req.body))
        } catch (error) {
            next(error)
        }
    },
    async getOffersByBookingId(req, res, next) {
        try {
            return res.json(await BookingService.getOffersByBookingId(req.query.booking_id))
        } catch (error) {
            next(error)
        }
    },
    async acceptOffer(req, res, next) {
        try {
            return res.json(await BookingService.acceptOffer(req.body))
        } catch (error) {
            next(error)
        }
    }
}