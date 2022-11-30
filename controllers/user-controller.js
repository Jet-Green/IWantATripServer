const UserService = require('../service/user-service')

module.exports = {
    async clearUsers() {
        try {
            UserService.clearUsers()
        } catch (error) {

        }
    },
    async registration(req, res, next) {
        try {
            const { email, password, fullname } = req.body;
            const userData = await UserService.registration(email, password, fullname)

            // добавить флаг secure: true чтобы активировать https
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
            return res.json(userData)
        } catch (error) {
            next(error)
        }
    },
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const userData = await UserService.login(email, password)

            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });

            return res.json(userData)
        } catch (error) {
            next(error)
        }
    },
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.cookies;

            const userData = await UserService.refresh(refreshToken)
            res.cookie('refreshToken', userData.refreshToken, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
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
    }
}