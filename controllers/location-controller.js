const LocationService = require('../service/location-service')
const s3 = require('../yandex-cloud.js')
const logger = require('../logger.js');

module.exports = {
    async getAll(req, res, next) {
        try {
            return res.json(await LocationService.findMany())
        } catch (error) {
            next(error)
        }
    },
    async searchLocation(req, res, next) {
        return res.json(await LocationService.searchLocation(req.query.name))
    },
    async selectUserLocation(req, res, next) {
        return res.json(await LocationService.selectUserLocation(req.query.user_id, req.body))
    },
    async createLocation(req, res, next) {
        return res.json(await LocationService.createLocation(req.body.location))
    },
     async deletePhotoFromLocation(req, res, next) {
        return res.json(await LocationService.deletePhotoFromLocation(req.body._id))
    },
    
    async uploadImage(req, res, next) {
        try {
            let _id = req.files[0]?.originalname.split('_')[0]

            let filename=""
            let buffers = []
            for (let file of req.files) {
                buffers.push({ buffer: file.buffer, name: file.originalname, });    // Буфер загруженного файла
            }

            if (buffers.length) {
                let uploadResult = await s3.Upload(buffers, '/iwat/locations');

                for (let upl of uploadResult) {
                    filename = upl.Location
                }
            }

            if (filename !="") {
                await LocationService.updateLocationImageUrl(_id, filename)
                logger.info({ filename, logType: 'location' }, 'images uploaded')
            }

            res.status(200).send('Ok')
        } catch (error) {
            logger.fatal({ error, logType: 'location error', brokenMethod: 'uploadImages' })
            next(error)
        }
    },
}