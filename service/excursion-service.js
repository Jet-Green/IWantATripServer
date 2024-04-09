const ExcursionModel = require('../models/excursion-model.js')

module.exports = {
    create(document) {
        return ExcursionModel.create(document)
    }
}