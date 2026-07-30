const UserModel = require('../models/user-model')
const ApiError = require('../exceptions/api-error')

// Не даёт покупать/заказывать пользователям, вошедшим через VK
// и не указавшим настоящую почту (стоит заглушка vk<id>@id.vk.com).
// Ставить в цепочку ПОСЛЕ authMiddleware.
module.exports = async function (req, res, next) {
    try {
        if (!req.user?._id) {
            return next()
        }
        const user = await UserModel.findById(req.user._id, { email: 1 })
        if (user?.email?.endsWith('@id.vk.com')) {
            return next(ApiError.BadRequest('Укажите вашу почту в личном кабинете — на неё приходят билеты и уведомления о заказах'))
        }
        next()
    } catch (error) {
        next(error)
    }
}
