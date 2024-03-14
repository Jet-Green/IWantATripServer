const tripsService = require('../service/trips-service')
const adminService = require('../service/admin-service')

const logger = require('../logger.js')

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
    async findCatalogTripsOnModeration(req, res, next) {
        try {
            return res.json(await tripsService.findCatalogTripsOnModeration())
        } catch (error) {
            next(error)
        }
    },
    async findRejectedCatalogTrips(req, res, next) {
        try {
            return res.json(await tripsService.findRejectedCatalogTrips())
        } catch (error) {
            next(error)
        }
    },
    async moderateTrip(req, res, next) {
        try {
            let tripFromDb = await tripsService.moderate(req.query._id, true)

            logger.info({ _id: tripFromDb._id.toString(), isModerated: true, rejected: false, logType: 'trip' }, 'trip moderated and published')

            return res.json(tripFromDb)
        } catch (error) {
            next(error)
        }
    },
    async sendModerationMessage(req, res, next) {
        try {
            let tripFromDb = await tripsService.sendModerationMessage(req.query.tripId, req.body.msg)

            logger.info({ _id: req.query.tripId, moderationMessage: req.body.msg, isModerated: false, rejected: true, logType: 'trip' }, 'trip rejected')

            return res.json(tripFromDb)
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
    async addCabinetNotifications(req, res, next) {
        try {
            return res.json(await adminService.addCabinetNotifications(req.body))
        } catch (error) {
            next(error)
        }
    },
    async getNotifications(req, res, next) {
        try {
            return res.json(await adminService.getNotifications(req.body))
        } catch (error) {
            next(error)
        }
    },
    async deleteNotifications(req, res, next) {
        try {
            return res.json(await adminService.deleteNotifications(req.body))
        } catch (error) {
            next(error)
        }
    }
}