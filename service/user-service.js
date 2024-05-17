const UserModel = require('../models/user-model')
const RoleModel = require('../models/role-model')
const TripCalcModel = require('../models/trip-calc-model')
const BillModel = require('../models/bill-model');
const TripModel = require('../models/trip-model');

const bcrypt = require('bcryptjs');
const TokenService = require('../service/token-service')
const LocationService = require('../service/location-service')

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

        // порпишу html тут, чтобы не отправлять токен на клиент
        sendMail(
            `<!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta http-equiv="X-UA-Compatible" content="IE=edge">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Document</title>
                </head>
                <body>
                    <h1>Чтобы поменять пароль перейдите по ссылке: </h1> <a href="${link}">${link}</a>
                </body>
            </html>`,
            [candidate.email], 'Восстановление пароля')

        return link
    },
    async buyTrip(_id, userEmail) {
        return UserModel.findOneAndUpdate({ email: userEmail }, { $push: { boughtTrips: _id } })
    },
    async cancelTrip(bill_id, user_id) {
        let bill = await BillModel.findById(bill_id);
        let trip_id = bill.tripId._id
        await TripModel.findByIdAndUpdate(trip_id, { $pull: { billsList: bill_id } })
        await BillModel.findByIdAndDelete(bill_id);
        return UserModel.findByIdAndUpdate(user_id, { $pull: { boughtTrips: bill_id } })
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

        const candidate = await UserModel.findOne({ email }).populate('tripCalc').exec()
        if (candidate) {
            throw ApiError.BadRequest(`Пользователь с почтой ${email} уже существует`)
        }
        const hashPassword = await bcrypt.hash(password, 3)

        const locationFromDb = await LocationService.createLocation(userLocation)
        const user = await UserModel.create({ email, password: hashPassword, fullname, userLocation: locationFromDb, roles: [candidateUser.value], date: Date.now() })

        const tokens = TokenService.generateTokens({ email, hashPassword, _id: user._id })
        await TokenService.saveToken(user._id, tokens.refreshToken);

        return {
            ...tokens,
            user
        }
    },
    async login(email, password) {
        const user = await UserModel.findOne({ email }).populate('tripCalc').populate('tinkoffContract').exec()

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

        const user = await UserModel.findById(userData._id).populate('tripCalc').populate('tinkoffContract').exec()
        if (user) {
            const tokens = TokenService.generateTokens({ email: user.email, password: user.password, _id: user._id })
            await TokenService.removeToken(refreshToken)
            await TokenService.saveToken(user._id, tokens.refreshToken);
            return {
                ...tokens,
                // pass the data to client
                user
            }
        } else {
            throw ApiError.UnauthorizedError();
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
        }).populate('tripCalc').exec()
    },
    async addTripCalc({ userId, tripCalc }) {
        let cb = await TripCalcModel.create(tripCalc)

        return await UserModel.findByIdAndUpdate(userId, { $push: { tripCalc: cb._id } }, { returnOriginal: false }).populate('tripCalc').exec()
    },
    async deleteTripCalc({ userId, tripCalcId }) {
        await UserModel.findByIdAndUpdate(userId, { $pull: { tripCalc: tripCalcId } })
        return await TripCalcModel.findByIdAndDelete(tripCalcId)
    },
    async getBoughtTrips(userId) {
        let userFromDb = await UserModel.findById(userId)
        await userFromDb.populate("boughtTrips")

        let { boughtTrips } = userFromDb

        let result = []
        for (let bill of boughtTrips) {
            await bill.populate('tripId')
            if (bill.tripId)
                await bill.tripId.populate('parent')

            if (bill.tripId?.parent) {
                let originalId = bill.tripId._id
                let parentId = bill.tripId.parent._id
                let { start, end } = bill.tripId
                let isModerated = bill.tripId.parent.isModerated

                Object.assign(bill.tripId, bill.tripId.parent)
                bill.tripId.parent = parentId
                bill.tripId.children = []
                bill.tripId._id = originalId
                bill.tripId.start = start
                bill.tripId.end = end
                bill.tripId.isModerated = isModerated
            }

            result.push(bill)
        }
        return result
    },

    async determineTheWinner() {
        function getRandomInt(max) {
            return Math.floor(Math.random() * max);
        }

        let users_registered_today = await UserModel.find(
            {
                date: { $gte: new Date().setHours(0, 0, 0, 0) }
            },
            { fullname: 1, email: 1 }
        )
        let user = users_registered_today[getRandomInt(users_registered_today.length)]

        await new Promise(r => setTimeout(r, 3000))

        return user
    },
    // async showTour({ step, type, _id }) {
    //     if (type == 'cabinetTour') {
    //         return await UserModel.findByIdAndUpdate(_id, { $set: { 'educationTours.cabinetTour': step } })
    //     }
    //     if (type == 'landingTour') {
    //         return await UserModel.findByIdAndUpdate(_id, { $set: { 'educationTours.landingTour': step } })
    //     }
    // },
    // async getTour(_id) {
    //     return await UserModel.findById(_id).select('educationTours')
    // },

    async setTripCalculator({ tripId, calcId }) {
        if (!calcId) {
            return TripModel.findByIdAndUpdate(tripId, { calculator: null })
        }
        return TripModel.findByIdAndUpdate(tripId, { calculator: calcId })
    },
    updateFullinfo({ userId, fullinfo }) {
        return UserModel.findByIdAndUpdate(userId, { fullinfo })
    }
}