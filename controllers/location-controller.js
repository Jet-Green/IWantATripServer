const LocationService = require('../service/location-service')

module.exports = {

async getLocations(req, res, next) {
    return res.json(await LocationService.getLocations({}))
},

}