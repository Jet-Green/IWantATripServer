const AppStateService = require('../service/app-state-service');

module.exports = {
    async deleteTripType(req, res, next) {
        try {
            return res.json(await AppStateService.deleteTripType(req.body.name))
        } catch (error) {
            next(error)
        }
    },
    async deleteTransportName(req, res, next) {
        try {
            return res.json(await AppStateService.deleteTransportName(req.body))
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
    async addPlaceCategory(req, res, next) {
        try {
            res.json(await AppStateService.addPlaceCategory(req.body.category))
        } catch (err) {
            next(err)
        }
    },

    
    async setTransportName(req, res, next) {
        try {
            res.json(await AppStateService.setTransportName(req.body))
        } catch (err) {
            next(err)
        }
    },
    async updateExcursionTypes(req, res, next) {
        try {
            return res.json(await AppStateService.updateExcursionTypes(req.body))
        } catch (error) {
            next(error)
        }
    },
    async deleteExcursionType(req, res, next) {
        try {
            return res.json(await AppStateService.deleteExcursionType(req.body))
        } catch (error) {
            next(error)
        }
    },
    async addTripRegion(req, res, next) {
        try {
            return res.json(await AppStateService.addTripRegion(req.body.tripRegion))
        } catch (error) {
            next(error)
        }
    },
    // deletes tripRegion from app state by tripRegion name
    async deleteTripRegion(req, res, next) {
        try {
            return res.json(await AppStateService.deleteTripRegion(req.body.tripRegion))
        } catch (error) {
            next(error)
        }
    },
    async deletePlaceCategory(req, res, next) {
        try {
            return res.json(await AppStateService.deletePlaceCategory(req.body.category))
        } catch (error) {
            next(error)
        }
    },


    
}