const UserService = require('../service/user-service')

module.exports = {
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
    }
}