const PhotosService = require('../service/photos-service')

module.exports = {
    async getPhotos(req, res, next) {
    
        try {
   console.log(req.query)
            return res.json(await PhotosService.getPhotos(req.query.page))
        } catch (error) {
            next(error)
        }
    }
}