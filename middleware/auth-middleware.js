const ApiError = require("../exceptions/api-error")
const tokenService = require("../service/token-service")

module.exports = function (req, res, next) {
    try {
        const authorizationHeader = req.headers.authorization;
        const refreshTokenFromCookie = req.cookies?.refreshToken;

        let token = null;
        let validateFn = tokenService.validateAccessToken;

        if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
            token = authorizationHeader.split(' ')[1];
            validateFn = tokenService.validateAccessToken;
        } else if (refreshTokenFromCookie) {
            token = refreshTokenFromCookie;
            validateFn = tokenService.validateRefreshToken;
        }

        if (!token) {
            return next(ApiError.UnauthorizedError());
        }

        const userData = validateFn(token);
        if (!userData) {
            return next(ApiError.UnauthorizedError());
        }

        req.user = userData;

        next();
    } catch (error) {
        return next(ApiError.UnauthorizedError());
    }
}