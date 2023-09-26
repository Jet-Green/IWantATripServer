const tripsService = require('../service/trips-service')
const adminService = require('../service/admin-service')

module.exports = {
    async findForModeration(req, res, next) {
        try {
            return res.json(await tripsService.findForModeration())
        } catch (error) {
            next(error)
        }
    },
    async findRejectedTrips(req, res, next) {
        try {
            return res.json(await tripsService.findRejectedTrips())
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
    },
    async fetchUsers(req, res, next) {
        try {
            return res.json(await adminService.fetchUsers(req.body))
        } catch (error) {
            next(error)
        }
    },
    async changeUserRoles(req, res, next) {
        try {
            return res.json(await adminService.changeUserRoles(req.body))
        } catch (error) {
            next(error)
        }
    },
    async addEmail(req, res, next) {
        try {
            return res.json(await adminService.addEmail(req.body))
        } catch (error) {
            next(error)
        }
    },
    async getEmails(req, res, next) {
        try {
            return res.json(await adminService.getEmails(req.query.event))
        } catch (error) {
            next(error)
        }
    },
    async deleteEmail(req, res, next) {
        try {
            return res.json(await adminService.deleteEmail(req.query))
        } catch (error) {
            next(error)
        }
    },
}