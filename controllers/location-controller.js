const LocationService = require('../service/location-service')

module.exports = {
    async getAll(req, res, next) {
        try {

            return res.json(await LocationService.findMany())
        } catch (error) {
            next(error)
        }
    },
    async searchLocation(req, res, next) {
        return res.json(await LocationService.searchLocation(req.query.name))
    },
    async selectUserLocation(req, res, next) {
        return res.json(await LocationService.selectUserLocation(req.query.user_id, req.body))
    }
}