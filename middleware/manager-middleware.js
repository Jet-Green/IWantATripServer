const ApiError = require("../exceptions/api-error")
const tokenService = require("../service/token-service")
const UserService = require('../service/user-service')

module.exports = async function (req, res, next) {
    try {
        const authorizationHeader = req.headers.authorization;

        if (!authorizationHeader) {
            return next(ApiError.UnauthorizedError());
        }

        const accessToken = authorizationHeader.split(' ')[1];
        if (!accessToken) {
            return next(ApiError.UnauthorizedError());
        }

        const userData = tokenService.validateAccessToken(accessToken);
        if (!userData) {
            return next(ApiError.UnauthorizedError());
        }

        const user = await UserService.checkUserEmail(userData.email);
        if (!user || !user.roles.includes('manager')) {
            return next(ApiError.NotManagerError());
        }

        req.user = userData;
        next();
    } catch (error) {
        next(ApiError.UnauthorizedError());
    }
}