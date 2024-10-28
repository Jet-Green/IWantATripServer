const PlacesService = require('../service/places-service')

const s3 = require('../yandex-cloud.js')
const logger = require('../logger.js');

module.exports = {
  async create(req, res, next) {
    try {
      return res.json(await PlacesService.create(req.body.place))
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
  }
}