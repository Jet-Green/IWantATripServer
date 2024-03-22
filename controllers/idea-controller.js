const ideaModel = require("../models/idea-model")

module.exports = {
    async createIdea(req, res, next) {
        try {
            await ideaModel.create(Object.assign(req.body, { author: req.user._id }))
            res.sendStatus(200)
        } catch (error) {
            next(error)
        }
    }
}