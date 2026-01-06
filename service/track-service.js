const TrackModel = require('../models/track-model');
const ApiError = require('../exceptions/api-error');

class TrackService {
  async create(trackData) {
    const track = await TrackModel.create(trackData);
    return await track.populate('author', 'email name');
  }

  async getAll(page = 1, query = {}) {
    const limit = 20;
    const skip = (page - 1) * limit;
    
    const filter = {isActive: true};
    
    if (query.type) {
      filter.type = query.type;
    }
    
    if (query.author) {
      filter.author = query.author;
    }
    
    if (query.search) {
      filter.$or = [
        {title: {$regex: query.search, $options: 'i'}},
        {subtitle: {$regex: query.search, $options: 'i'}},
        {description: {$regex: query.search, $options: 'i'}}
      ];
    }

    const tracks = await TrackModel
      .find(filter)
      .populate('author', 'email name')
      .populate('places')
      .sort({createdDate: -1})
      .skip(skip)
      .limit(limit);

    const total = await TrackModel.countDocuments(filter);

    return {
      tracks,
      total,
      page,
      pages: Math.ceil(total / limit)
    };
  }

  async getById(_id) {
    const track = await TrackModel
      .findById(_id)
      .populate('author', 'email name')
      .populate('places');
    
    if (!track) {
      throw ApiError.NotFound('Трек не найден');
    }
    
    return track;
  }

  async edit(trackId, trackData) {
    const track = await TrackModel.findById(trackId);
    
    if (!track) {
      throw ApiError.NotFound('Трек не найден');
    }

    Object.assign(track, trackData);
    await track.save();
    
    return await track.populate(['author', 'places']);
  }

  async delete(id) {
    const track = await TrackModel.findById(id);
    
    if (!track) {
      throw ApiError.NotFound('Трек не найден');
    }

    track.isActive = false;
    await track.save();
    
    return {message: 'Трек успешно удалён'};
  }
}

module.exports = new TrackService();
