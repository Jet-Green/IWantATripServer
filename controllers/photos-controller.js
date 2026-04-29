const PhotosService = require('../service/photos-service')

module.exports = {
    async getPhotos(req, res, next) {
    
        try {

            return res.json(await PhotosService.getPhotos(req.query.page))
        } catch (error) {
            next(error)
        }
    },

    async uploadPhotobank(req, res, next) {
        try {
            if (!req.files || req.files.length === 0) {
                return res.status(400).json({ message: 'Не переданы файлы' });
            }
            const userId =
                req.user?._id != null
                    ? String(req.user._id)
                    : req.user?.id != null
                      ? String(req.user.id)
                      : '';
            if (!userId) {
                return res.status(401).json({ message: 'Не удалось определить пользователя' });
            }
            const urls = await PhotosService.uploadPhotobankPhotos(req.files, userId);
            return res.status(200).json({ urls });
        } catch (error) {
            if (error.statusCode === 400) {
                return res.status(400).json({ message: error.message });
            }
            if (error.statusCode === 401) {
                return res.status(401).json({ message: error.message });
            }
            next(error);
        }
    },
}