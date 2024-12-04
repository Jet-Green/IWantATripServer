const PartnersService = require('../service/partners-service.js')


const logger = require('../logger.js');

module.exports = {
  async getAll(req, res, next) {
    try {

      return res.json(await PartnersService.getAll(req.body))
    } catch (error) {
      next(error)
    }
  },
  async create(req, res, next) {
    try {
      return res.json(await PartnersService.create(req.body.partner))
    } catch (error) {
      next(error)
    }
  },
  async delete(req, res, next) {
    try {
      return res.json(await PartnersService.delete(req.body.id))
    } catch (error) {
      next(error)
    }
  },

  async edit(req, res, next) {
    try {
      let { partnerId, form} = req.body;
      return res.json(await PartnersService.edit(partnerId, form))
    } catch (error) {
      next(error)
    }
  },
  


  async getById(req, res, next) {
    try {
      const { _id } = req.query;
      console.log(_id)
      console.log(res.json(await PartnersService.getById(_id)))
      return res.json(await PartnersService.getById(_id))
    } catch (error) {
      next(error)
    }
  },

  async getForCreateTrip(req, res, next) {
    try {
      return res.json(await PartnersService.getForCreateTrip())
    } catch (error) {
      next(error)
    }
  }
  
}