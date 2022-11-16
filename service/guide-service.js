const GuideModel = require('../models/guide-element-model.js');

module.exports = {
    async clear() {
        return GuideModel.deleteMany({ 'type': 'watch' })
    },
    async createElement(element) {
        return GuideModel.create(element)
    },
    async updateGuideElementImage(_id, filename) {
        const element = await GuideModel.findById(_id)
        element.image = filename
        return element.save()
    },
    async deleteOne(_id) {
        return GuideModel.deleteOne({_id: _id})
    },
    async getAllElements(type) {
        return GuideModel.find({ 'type': type }).exec()
    }
}