const trackService = require('../service/track-service');

class TrackController {
  async create(req, res, next) {
    try {
      const {track} = req.body;
      const result = await trackService.create(track);
      return res.json(result);
    } catch (e) {
      next(e);
    }
  }

  async getAll(req, res, next) {
    try {
      const {page, query} = req.body;
      const result = await trackService.getAll(page, query);
      return res.json(result);
    
    } catch (e) {
      next(e);
    }
  }

  async getById(req, res, next) {
    try {
      const {_id} = req.query;
      const track = await trackService.getById(_id);
      return res.json(track);
    } catch (e) {
      next(e);
    }
  }

  async edit(req, res, next) {
    try {
      const {trackId, track} = req.body;
      const result = await trackService.edit(trackId, track, req.user);
      return res.json(result);
    } catch (e) {
      next(e);
    }
  }

  async delete(req, res, next) {
    try {
      const {id} = req.body;
      const result = await trackService.delete(id);
      return res.json(result);
    } catch (e) {
      next(e);
    }
  }

  async moderate(req, res, next) {
    try {
      const {id} = req.body;
      const track = await trackService.moderate(id);
      return res.json(track);
    } catch (e) {
      next(e);
    }
  }

  async editStats(req, res, next) {
    try {
      const { trackId, track } = req.body;
      const result = await trackService.editStats(trackId, track, req.user);
      return res.json(result);
    } catch (e) {
      next(e);
    }
  }
}

module.exports = new TrackController();
