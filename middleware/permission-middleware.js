const ApiError = require("../exceptions/api-error");
const tokenService = require("../service/token-service");

module.exports = function (req, res, next) {
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

        // req.user = userData;

        // 🔒 Проверка соответствия _id в теле запроса
        if (req.body._id && req.body._id !== userData._id) {
            return next(ApiError.UnauthorizedError());
        }

        next();
    } catch (error) {
        return next(ApiError.UnauthorizedError());
    }
};