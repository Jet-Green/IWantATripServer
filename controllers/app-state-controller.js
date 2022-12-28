const AppStateService = require('../service/app-state-service');

module.exports = {
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
    }
}