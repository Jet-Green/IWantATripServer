const PlacesService = require('../service/places-service')

const s3 = require('../yandex-cloud.js')
const logger = require('../logger.js');

module.exports = {
  async getAll(req, res, next) {
    try {

      return res.json(await PlacesService.getAll(req.body))
    } catch (error) {
      next(error)
    }
  },
  async create(req, res, next) {
    try {
      return res.json(await PlacesService.create(req.body.place))
    } catch (error) {
      next(error)
    }
  },
  async delete(req, res, next) {
    try {
      return res.json(await PlacesService.delete(req.body.id))
    } catch (error) {
      next(error)
    }
  },

  
  async uploadImages(req, res, next) {
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
      await PlacesService.setPlaceImagesUrls(_id, filenames)
      logger.info({ filenames, logType: 'place' }, 'images uploaded')
    }

    res.status(200).send('Ok')
  },
  async getForModeration(req, res, next) {
    try {
      const { status } = req.query

      switch (status) {
        case 'on-moderation':
          return res.json(await PlacesService.getOnModeration())

        case 'rejected':
          return res.json(await PlacesService.getRejected())
      }
      return res.json([])
    } catch (error) {
      next(error)
    }
  },
  async getById(req, res, next) {
    try {
      const { _id } = req.query;
      
      return res.json(await PlacesService.getById(_id))
    } catch (error) {
      next(error)
    }
  },
  async moderatePlace(req, res, next) {
    try {
      const { _id } = req.query;
      
      return res.json(await PlacesService.moderatePlace(_id))
    } catch (error) {
      next(error)
    }
  },
  async rejectPlace(req, res, next) {
    try {
      const { _id } = req.query;
      
      return res.json(await PlacesService.rejectPlace(_id))
    } catch (error) {
      next(error)
    }
  },
  
  
}