const LocationModel = require('../models/location-model.js')

module.exports = {
    async createLocation(loc) {
        let candidate = await LocationModel.find(loc)

        if (candidate) {
            return candidate
        } else {
            return LocationModel.create(loc)
        }
    },
}