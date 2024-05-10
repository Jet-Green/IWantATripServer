const ExcursionService = require('../service/excursion-service.js')
const LocationService = require('../service/location-service.js')
const s3 = require('../yandex-cloud.js')
const logger = require('../logger.js');

module.exports = {
    async create(req, res, next) {
        try {
            let location = await LocationService.createLocation(req.body.excursion.location)
            if (location?._id)
                req.body.excursion.location = location._id.toString()
            let callback = await ExcursionService.create(req.body)
            return res.json({ _id: callback._id.toString() })
        } catch (error) {
            next(error)
        }
    },
    async uploadImages(req, res, next) {
        try {
            let _id = req.files[0]?.originalname.split('_')[0]

            let filenames = []
            let buffers = []
            for (let file of req.files) {
                buffers.push({ buffer: file.buffer, name: file.originalname, });    // Буфер загруженного файла
            }

            if (buffers.length) {
                let uploadResult = await s3.Upload(buffers, '/iwat/');

                for (let upl of uploadResult) {
                    filenames.push(upl.Location)
                }
            }
            if (filenames.length) {
                await ExcursionService.updateImagesUrls(_id, filenames)
                logger.info({ filenames, logType: 'excursion' }, 'images uploaded')
            }
            return res.json({ status: 'ok' })
        } catch (error) {
            next(error)
        }
    },
    async getById(req, res, next) {
        try {
            return res.json(await ExcursionService.getById(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async getUserExcursions(req, res, next) {
        try {
            return res.json(await ExcursionService.getByUserId(req.query.user_id))
        } catch (error) {
            next(error)
        }
    },
    /** 
     * dates are from datePlugin.excursions.concatDateAndTime
     * _id is excursion _id
    */
    async createDates(req, res, next) {
        try {
            return res.json(await ExcursionService.createDates(req.body))
        } catch (error) {
            next(error)
        }
    },
    async deleteTime(req, res, next) {
        try {
            return res.json(await ExcursionService.deleteTime(req.body))
        } catch (error) {
            next(error)
        }
    },
    async deleteDate(req, res, next) {
        try {
            return res.json(await ExcursionService.deleteDate(req.body))
        } catch (error) {
            next(error)
        }
    },

    
    
    async getAll(req, res, next) {
        try {
            return res.json(await ExcursionService.getAll())
        } catch (error) {
            next(error)
        }
    },
    async getExcursionById(req, res, next) {
        try {
            return res.json(await ExcursionService.getExcursionById(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async deleteById(req, res, next) {
        try {
            return res.json(await ExcursionService.deleteById(req.body._id));
        } catch (error) {
            next(error)
        }
    },


    async hideById(req, res, next) {
        try {
            await ExcursionService.hideById(req.body._id, req.body.isHide)
            return res.json('OK')
        } catch (error) {
            next(error)
        }
    },
    async buy(req, res, next) {
        try {
            return res.json(await ExcursionService.buy(req.body))
        } catch (error) {
            next(error)
        }
    }
}