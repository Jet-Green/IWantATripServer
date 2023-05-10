const PosterService = require('../service/poster-service')

module.exports = {
    async getAll(req, res, next) {
        try {
            return res.json(await PosterService.getAll())
        } catch (error) {
            next(error)
        }
    }
}