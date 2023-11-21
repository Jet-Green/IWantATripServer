const GuideElementModel = require('../models/guide-element-model')

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
       
        return GuideElementModel.updateOne({}, { $push: { taxi: taxi } })
    },
    getLocalTaxi(location) {
       
        return GuideElementModel.find({},{taxi:1, _id:0})
    },
    deleteTaxi(name) {
        return GuideElementModel.findOneAndUpdate({}, { $pull: { 'taxi': name } })
    },
}