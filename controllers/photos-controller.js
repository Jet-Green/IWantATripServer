const PhotosService = require('../service/photos-service')

module.exports = {
    async getPhotos(req, res, next) {
    
        try {
   
            return res.json(await PhotosService.getPhotos())
        } catch (error) {
            next(error)
        }
    }
}