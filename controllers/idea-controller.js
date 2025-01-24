const ideaModel = require("../models/idea-model")
const { sendPost } = require("../service/telegram-service")
const sanitizeHtml = require('sanitize-html');
function sanitize(input) {    return sanitizeHtml(input, {
    allowedTags: ['b', 'i', 'em', 'strong', 'a', 'p', 'ul', 'ol', 'li', 'br'],
    allowedAttributes: {
        'a': ['href', 'target', 'rel'], // Разрешаем только ссылки и их атрибуты
        'img': ['src', 'alt', 'title', 'width', 'height'] // Разрешаем изображения и их атрибуты
    },
    allowedSchemes: ['http', 'https', 'data'], // Запрещаем потенциально опасные схемы (например, javascript:)
    allowedSchemesByTag: {
        img: ['http', 'https', 'data'] // Специально для тегов <img>
    },
    // Предотвращаем JavaScript-инъекции
    enforceHtmlBoundary: true
})
}

module.exports = {
    async createIdea(req, res, next) {
        try {
            req.body.description=sanitize(req.body.description)
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