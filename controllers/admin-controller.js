const tripsService = require('../service/trips-service')

module.exports = {
    async findForModeration(req, res, next) {
        try {
            return res.json(await tripsService.findForModeration())
        } catch (error) {
            next(error)
        }
    },
    async moderateTrip(req, res, next) {
        try {
            return res.json(await tripsService.moderate(req.query._id, true))
        } catch (error) {
            next(error)
        }
    },
    async sendModerationMessage(req, res, next) {
        try {
            return res.json(await tripsService.sendModerationMessage(req.query.tripId, req.body.msg))
        } catch (error) {
            next(error)
        }
    }
}