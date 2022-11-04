const UserModel = require('../models/user-model')
const bcrypt = require('bcryptjs');
const tokenService = require('../service/token-service')
const ApiError = require('../exceptions/api-error');

module.exports = {
    async registration(email, password, fullname) {
        const candidate = await UserModel.findOne({ email })
        if (candidate) {
            throw ApiError.BadRequest(`Пользователь с почтой ${email} уже существует`)
        }

        const hashPassword = await bcrypt.hash(password, 3)
        const user = await UserModel.create({ email, password: hashPassword, fullname })

        const tokens = tokenService.generateTokens({ email, hashPassword })
        await tokenService.saveToken(user._id, tokens.refreshToken);

        return {
            ...tokens,
            user: {
                email: user.email,
                fullname: user.fullname,
            }
        }
    }
}