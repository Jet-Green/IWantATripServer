const PhotosService = require('../service/photos-service')

module.exports = {
    async getPhotos(req, res, next) {
    
        try {

            return res.json(await PhotosService.getPhotos(req.query.page))
        } catch (error) {
            next(error)
        }
    }
}