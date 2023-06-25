const AppStateService = require('../service/app-state-service');

module.exports = {
    dropDatabase(req, res, next) {
        return res.json(AppStateService.dropDatabase())
    },

    async deleteTripType(req, res, next) {
        try {
            return res.json(await AppStateService.deleteTripType(req.body.name))
        } catch (error) {
            next(error)
        }
    },
    async getState(req, res, next) {
        try {
            return res.send(await AppStateService.getState())
        } catch (err) {
            next(err)
        }
    },
    async update(req, res, next) {
        try {
            res.json(await AppStateService.update(req.body))
        } catch (err) {
            next(err)
        }
    },
    async createState(req, res, next) {
        try {
            res.json(await AppStateService.createState())
        } catch (err) {
            next(err)
        }
    },
    async deleteMPMById(req, res, next) {
        try {
            res.json(await AppStateService.deleteMPMById(req.query.index))
        } catch (error) {
            next(error)
        }
    },
    async addTripType(req, res, next) {
        try {
            res.json(await AppStateService.update(req.body))
        } catch (err) {
            next(err)
        }
    },
    async setTripType(req, res, next) {
        try {
            res.json(await AppStateService.setTripType(req.body.type))
        } catch (err) {
            next(err)
        }
    },
}