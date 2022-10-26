const GuideModel = require('../models/guide-element-model.js');

module.exports = {
    async createElement(element) {
        return GuideModel.create(element)
    },
    async updateGuideElementImage(_id, filename) {
        const element = await GuideModel.findById(_id)
        element.image = filename
        return element.save()
    }
}