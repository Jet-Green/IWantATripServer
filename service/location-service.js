const LocationModel = require('../models/location-model.js')
const UserModel = require('../models/user-model.js')

module.exports = {
    searchLocation(name) {
        return LocationModel.find(
            { name: { $regex: name, $options: 'i' } },
        )
    },
    async createLocation(loc) {
        let candidate = await LocationModel.find({ geo_lat: loc.geo_lat, geo_lon: loc.geo_lon })

        if (candidate.length == 1) {
            return candidate
        } else {
            return LocationModel.create(loc)
        }

    },
    isNearPlace(basePlaceGeo, placeGeo) {
        let y = placeGeo.geo_lat
        let x = placeGeo.geo_lon
        let y0 = basePlaceGeo.geo_lat
        let x0 = basePlaceGeo.geo_lon
        // в градусах в нашей полосе примерно 120 км
        let R = 2
        if (((x - x0) * (x - x0)) + ((y - y0) * (y - y0)) <= (R * R)) {
            return true
        }
        return false
    },
    selectUserLocation(userId, location) {
        return UserModel.findByIdAndUpdate(userId, { userLocation: location })
    }
}