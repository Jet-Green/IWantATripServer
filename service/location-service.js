const LocationModel = require('../models/location-model.js')

module.exports = {
    insertOne(loc) {
        return LocationModel.create(loc)
    },
}