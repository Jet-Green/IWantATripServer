const GuideElementModel = require('../models/guide-element-model')
const TaxiModel = require('../models/taxi-model')

module.exports = {
    async clear() {
        return GuideElementModel.deleteMany({ 'type': 'watch' })
    },
    async createElement(element) {
        return GuideElementModel.create(element)
    },
    async updateGuideElementImage(_id, filename) {
        const element = await GuideElementModel.findById(_id)
        element.image = filename
        return element.save()
    },
    async deleteOne(_id) {
        return GuideElementModel.deleteOne({ _id: _id })
    },
    async getAllElements(type) {
        return GuideElementModel.find({ 'type': type }).exec()
    },
    setTaxi(taxi) {
        return TaxiModel.create(taxi)
    },
    getLocalTaxi(location) {
        if (location == null) {
            return TaxiModel.find({})
        } else {
            return TaxiModel.find({ location: location})
        }
    },
    deleteTaxi(_id) {
        return TaxiModel.deleteOne({ _id: _id })
    },
}