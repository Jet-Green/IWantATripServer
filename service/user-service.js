const UserModel = require('../models/user-model')
const bcrypt = require('bcryptjs');
const tokenService = require('../service/token-service')
const ApiError = require('../exceptions/api-error');

module.exports = {
    async clearUsers() {
        console.log(
            await UserModel.deleteMany({})
        );
    },
    async registration(email, password, fullname) {
        const candidate = await UserModel.findOne({ email })
        if (candidate) {
            throw ApiError.BadRequest(`Пользователь с почтой ${email} уже существует`)
        }

        const hashPassword = await bcrypt.hash(password, 3)
        const user = await UserModel.create({ email, password: hashPassword, fullname })

        const tokens = tokenService.generateTokens({ email, hashPassword, _id: user._id })
        await tokenService.saveToken(user._id, tokens.refreshToken);

        return {
            ...tokens,
            user
        }
    },
    async login(email, password) {
        const user = await UserModel.findOne({ email })

        if (!user) {
            throw ApiError.BadRequest('Пользователь с таким email не найден')
        }

        const isPassEquals = await bcrypt.compare(password, user.password)

        if (!isPassEquals) {
            throw ApiError.BadRequest('Неверный пароль')
        }

        const tokens = tokenService.generateTokens({ email, password: user.password, _id: user._id })

        await tokenService.saveToken(user._id, tokens.refreshToken);
        return {
            ...tokens,
            // pass the data to client
            user
        }
    },
    async refresh(refreshToken) {
        if (!refreshToken) {
            throw ApiError.UnauthorizedError();
        }
        const userData = tokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await tokenService.findToken(refreshToken);

        if (!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError();
        }

        const user = await UserModel.findById(userData._id)

        const tokens = tokenService.generateTokens({ email: user.email, password: user.password, _id: user._id })
        await tokenService.saveToken(user._id, tokens.refreshToken);
        return {
            ...tokens,
            // pass the data to client
            user
        }
    },
    async logout(refreshToken) {
        const token = await tokenService.removeToken(refreshToken);

        return token;
    },
    async update(user) {
        let email = user.email;
        delete user.email
        return await UserModel.findOneAndUpdate({ email }, user, {
            new: true
        })
    },
}