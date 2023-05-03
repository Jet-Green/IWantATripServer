const UserModel = require('../models/user-model')
const bcrypt = require('bcryptjs');
const TokenService = require('../service/token-service')
const RoleModel = require('../models/role-model')
const ApiError = require('../exceptions/api-error');
const { sendMail } = require('../middleware/mailer');

module.exports = {
    async resetPassword(payload) {
        let { password, token, user_id } = payload;
        let result;
        try {
            result = await this.validateEnterToResetPassword({ token, user_id })
        } catch (error) { }

        if (result) {
            const hashPassword = await bcrypt.hash(password, 3)
            const user = await UserModel.findOneAndUpdate({ _id: user_id }, { password: hashPassword })

            const tokens = TokenService.generateTokens({ email: user.email, hashPassword, _id: user._id })
            await TokenService.saveToken(user._id, tokens.refreshToken);

            return {
                ...tokens,
                user
            }
        }
        return null
    },
    async validateEnterToResetPassword(payload) {
        let { user_id, token } = payload;

        let candidate = await UserModel.findById(user_id)
        if (!candidate) throw ApiError.BadRequest('Пользователь с таким _id не найден')

        let secret = process.env.JWT_RESET_SECRET + candidate.password
        let result = TokenService.validateResetToken(token, secret)

        if (result == null) throw ApiError.BadRequest('Нет доступа')

        return result
    },
    async sendResetLink(email) {
        let candidate = await UserModel.findOne({ email: email })

        if (!candidate)
            throw ApiError.BadRequest('Пользователь с таким email не найден')

        // ну вот так
        const secret = process.env.JWT_RESET_SECRET + candidate.password
        const payload = {
            email: candidate.email,
            _id: candidate._id
        }

        const token = TokenService.createResetToken(payload, secret)

        const link = process.env.CLIENT_URL + `/forgot-password?user_id=${candidate._id}&token=${token}`

        sendMail({ link: link }, 'reset-password.hbs', [candidate.email], 'single')

        return link
    },
    async buyTrip(_id, userEmail) {
        return UserModel.findOneAndUpdate({ email: userEmail }, { $push: { boughtTrips: _id } })
    },
    async clearUsers() {
        console.log(
            await UserModel.deleteMany({})
        );
    },
    async registration(body) {
        const { email, password, fullname, userLocation } = body;

        let candidateUser = await RoleModel.findOne({ value: 'user' })
        let candidateManager = await RoleModel.findOne({ value: 'manager' })
        let candidateAdmin = await RoleModel.findOne({ value: 'admin' })

        if (!candidateUser) {
            candidateUser = await RoleModel.create({ value: 'user' })
        }
        if (!candidateAdmin) {
            candidateAdmin = await RoleModel.create({ value: 'admin' })
        }
        if (!candidateManager) {
            candidateManager = await RoleModel.create({ value: 'manager' })
        }

        const candidate = await UserModel.findOne({ email })
        if (candidate) {
            throw ApiError.BadRequest(`Пользователь с почтой ${email} уже существует`)
        }
        const hashPassword = await bcrypt.hash(password, 3)
        const user = await UserModel.create({ email, password: hashPassword, fullname, userLocation, roles: [candidateAdmin.value], })

        const tokens = TokenService.generateTokens({ email, hashPassword, _id: user._id })
        await TokenService.saveToken(user._id, tokens.refreshToken);

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

        const tokens = TokenService.generateTokens({ email, password: user.password, _id: user._id })

        await TokenService.saveToken(user._id, tokens.refreshToken);
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
        const userData = TokenService.validateRefreshToken(refreshToken);
        const tokenFromDb = await TokenService.findToken(refreshToken);

        if (!userData || !tokenFromDb) {
            throw ApiError.UnauthorizedError();
        }

        const user = await UserModel.findById(userData._id)

        const tokens = TokenService.generateTokens({ email: user.email, password: user.password, _id: user._id })
        await TokenService.saveToken(user._id, tokens.refreshToken);
        return {
            ...tokens,
            // pass the data to client
            user
        }
    },
    async logout(refreshToken) {
        const token = await TokenService.removeToken(refreshToken);

        return token;
    },
    async update(user) {
        let email = user.email;
        delete user.email
        return await UserModel.findOneAndUpdate({ email }, user, {
            new: true
        })
    }
}