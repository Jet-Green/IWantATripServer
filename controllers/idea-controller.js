const ideaModel = require("../models/idea-model")
const { sendPost } = require("../service/telegram-service")

module.exports = {
    async createIdea(req, res, next) {
        try {
            let idea = await ideaModel.create(Object.assign(req.body, { author: req.user._id }))
            await sendPost(`<b>Новая идея!</b> <b>Тема:</b> ${idea.topic} ${idea.description}`)
            res.sendStatus(200)
        } catch (error) {
            next(error)
        }
    }
}