const ideaModel = require("../models/idea-model")
const { sendPost } = require("../service/telegram-service")

module.exports = {
    async createIdea(req, res, next) {
        try {
            let idea = await ideaModel.create(Object.assign(req.body, { author: req.user._id }))
            await sendPost(`
            <b>Новая идея!</b>
            <b>Тема:</b> ${idea.topic}
            <b>Краткое описание:</b> ${idea.offer}
            <b>Примерная дата:</b> ${idea.date}
            <b>Маршрут:</b> ${idea.tripRoute}
            <b>Количество людей:</b> ${idea.maxPeople}
            <b>Описание:</b> ${idea.description}
            `)
            return res.json(idea)
        } catch (error) {
            next(error)
        }
    }
}