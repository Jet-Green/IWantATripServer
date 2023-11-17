const ApiError = require("./api-error");
const logger = require('../logger')

function errorFilter(err, req, res, next) {
    if (err instanceof ApiError) {
        return res.status(err.status).json({ message: err.message, errors: err.errors });
    }

    logger.fatal(err, 'server error')

    return res.status(500).json({ message: 'Непредвиденная ошибка' })
}

module.exports = errorFilter