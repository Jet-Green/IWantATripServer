const UserService = require('../service/user-service')

module.exports = {
    async resetPassword(req, res, next) {
        try {
            const userData = await UserService.resetPassword(req.body)

            // добавить флаг secure: true чтобы активировать https
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, secure: true });
            return res.json(userData)
        } catch (error) {
            next(error)
        }
    },
    async sendResetLink(req, res, next) {
        try {
            let link = await UserService.sendResetLink(req.body.email)
            return res.json(link)
        } catch (error) {
            next(error)
        }
    },
    async buyTrip(req, res, next) {
        try {
            const _id = req.body._id
            const userEmail = req.body.userEmail
            return res.json(await UserService.buyTrip(_id, userEmail))
        } catch (error) {
            next(error)
        }
    },
    async cancelTrip(req, res, next) {
        try {
            return res.json(await UserService.cancelTrip(req.body.bill_id, req.body.user_id))
        } catch (error) {
            next(error)
        }
    },
    async clearUsers() {
        try {
            UserService.clearUsers()
        } catch (error) {

        }
    },
    async registration(req, res, next) {
        try {
            const userData = await UserService.registration(req.body)

            // добавить флаг secure: true чтобы активировать https
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, secure: true });
            return res.json(userData)
        } catch (error) {
            next(error)
        }
    },
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const userData = await UserService.login(email, password)

            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, secure: true });

            return res.json(userData)
        } catch (error) {
            next(error)
        }
    },
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.cookies;

            const userData = await UserService.refresh(refreshToken)
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, secure: true });
            // const newUser = await UserService.update(userData)

            return res.json(userData);
        } catch (error) {
            // попадаем в middleware с обработкой ошибок
            next(error)
        }
    },
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.cookies;
            const token = await UserService.logout(refreshToken)
            res.clearCookie('refreshToken')

            return res.json(token);
        } catch (error) {
            // попадаем в middleware с обработкой ошибок
            next(error)
        }
    },
    async update(req, res, next) {
        try {
            const newUser = await UserService.update(req.body)
            return res.json(newUser)
        } catch (error) {
            next(error)
        }
    },
    async addTripCalc(req, res, next) {
        try {
            return res.json(await UserService.addTripCalc(req.body))
        } catch (error) {
            next(error)
        }
    },
    async deleteTripCalc(req, res, next) {
        try {
            return res.json(await UserService.deleteTripCalc(req.body))
        } catch (error) {
            next(error)
        }
    },
    async getBoughtTrips(req, res, next) {
        try {
            return res.json(await UserService.getBoughtTrips(req.query.user_id))
        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    async determineTheWinner(req, res, next) {
        try {
            return res.json(await UserService.determineTheWinner())
        } catch (error) {
            next(error)
        }
    },
    /***
     * body {
     *  calcId - new calculator id, may be null or undefined
     *  tripId - trip id, must be present
     * }
     */
    async setTripCalculator(req, res, next) {
        try {
            return res.json(await UserService.setTripCalculator(req.body))
        } catch (error) {
            next(error)
        }
    }
}