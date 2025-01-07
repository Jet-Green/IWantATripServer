const TasksService = require('../service/tasks-service.js')


const logger = require('../logger.js');

module.exports = {
  async getAll(req, res, next) {
    try {

      return res.json(await TasksService.getAll(req.body))
    } catch (error) {
      next(error)
    }
  },
  async getTasksAmount(req, res, next) {
    try {
      return res.json(await TasksService.getTasksAmount(req.body.query))
    } catch (error) {
      next(error)
    }
  },
  async create(req, res, next) {
    try {
      return res.json(await TasksService.create(req.body.task))
    } catch (error) {
      next(error)
    }
  },
  async delete(req, res, next) {
    try {
      return res.json(await TasksService.delete(req.body.id))
    } catch (error) {
      next(error)
    }
  },

  async edit(req, res, next) {
    try {
      let { placeId, place } = req.body;
      return res.json(await TasksService.edit(place, placeId))
    } catch (error) {
      next(error)
    }
  },


  async getById(req, res, next) {
    try {
      const { _id } = req.query;

      return res.json(await TasksService.getById(_id))
    } catch (error) {
      next(error)
    }
  },

  async createInteraction(req, res, next) {
    try {
      return res.json(await TasksService.createInteraction(req.body.interaction, req.body.taskId))
    } catch (error) {
      next(error)
    }
  },
  async deleteManager(req, res, next) {
    try {
      return res.json(await TasksService.deleteManager(req.body))
    } catch (error) {
      next(error)
    }
  },
  async addPayment(req, res, next) {
    try {
      return res.json(await TasksService.addPayment(req.body))
    } catch (error) {
      next(error)
    }
  },
  async changeStatus(req, res, next) {
    try {
      return res.json(await TasksService.changeStatus(req.body))
    } catch (error) {
      next(error)
    }
  },
  async edit(req, res, next) {
    try {
      return res.json(await TasksService.edit(req.body))
    } catch (error) {
      console.log(error);
      
      next(error)
    }
  }
}