const LocationModel = require('../models/location-model.js')
const UserModel = require('../models/user-model.js')

module.exports = {
    findMany() {

        return LocationModel.find({}).exec()
    },
    searchLocation(name) {
        return LocationModel.find(
            { name: { $regex: name, $options: 'i' } },
        )
    },
    async createLocation(loc) {
        loc.coordinates = [Number(loc.coordinates[0]), Number(loc.coordinates[1])]

        // Сначала ищем по названию: DaData время от времени меняет точность
        // координат (58.135907 → 58.1359039), и поиск по точному совпадению
        // заводил второй «г Ижевск», «г Глазов» и т. д. — в окне выбора города
        // появлялись дубли. Если по названию не нашли — ищем точку рядом,
        // в пределах ~100 метров.
        let candidate = null
        if (loc.name) {
            candidate = await LocationModel.findOne({ name: loc.name })
        }
        if (!candidate) {
            const eps = 0.001
            candidate = await LocationModel.findOne({
                $and: [
                    { 'coordinates.0': { $gte: loc.coordinates[0] - eps, $lte: loc.coordinates[0] + eps } },
                    { 'coordinates.1': { $gte: loc.coordinates[1] - eps, $lte: loc.coordinates[1] + eps } },
                ]
            })
        }

        if (!candidate) {
            return await LocationModel.create(loc)
        }
        return candidate
    },
    async deletePhotoFromLocation(_id) {
        return await LocationModel.findByIdAndUpdate(
            _id,
            { image: "" },       
            { new: true }        
        )
    },

    // isNearPlace(userPlaceGeo, placeGeo) {
    //     // когда нет локации
    //     if (userPlaceGeo.geo_lat == '' || userPlaceGeo.geo_lon == '') {
    //         return true
    //     }
    //     let y = placeGeo.geo_lat
    //     let x = placeGeo.geo_lon
    //     let y0 = userPlaceGeo.geo_lat
    //     let x0 = userPlaceGeo.geo_lon
    //     // в градусах в нашей полосе примерно 120 км
    //     let R = 2
    //     if (((x - x0) * (x - x0)) + ((y - y0) * (y - y0)) <= (R * R)) {
    //         return true
    //     }
    //     return false
    // },
    selectUserLocation(userId, location) {
        return UserModel.findByIdAndUpdate(userId, { userLocation: location })
    },
    async updateLocationImageUrl(_id, imageURL) {
        let locationFromDb = await LocationModel.findById(_id)
        locationFromDb.image = imageURL
        return locationFromDb.save()
    }
}