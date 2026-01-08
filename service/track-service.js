const { Types } = require('mongoose');
const TrackModel = require('../models/track-model');
const PlaceModel = require('../models/place-model');
const ApiError = require('../exceptions/api-error');
const UserModel = require('../models/user-model');

class TrackService {
    async create(trackData) {
        const track = await TrackModel.create(trackData);
        return await track.populate('author', 'email name');
    }

    async getAll(page = 1, query = {}) {

        const limit = 20;
        const skip = (page - 1) * limit;
        console.log('TrackService.getAll query:', JSON.stringify(query));
        const filter = {
            isActive: true,
        };

        if (query.hasOwnProperty('isHidden')) {
            filter.isHidden = query.isHidden;
        }

        if (query.hasOwnProperty('isRejected')) {
            filter.isRejected = query.isRejected;
        }

        if (query.hasOwnProperty('isModerated') || query.hasOwnProperty('isModeration')) {
            filter.isModerated = query.isModerated ?? query.isModeration;
        }

        if (query.type) {
            filter.type = query.type;
        }

        if (query.author) {
            filter.author = query.author;
        }

        if (query.search) {
            filter.$or = [
                { title: { $regex: query.search, $options: 'i' } },
                { subtitle: { $regex: query.search, $options: 'i' } },
            ];
        }

        // Геопоиск по координатам первого места
        const conditions = query.conditions || {};
        const coords = conditions.location?.coordinates || query.location?.coordinates;
        const radius = conditions.locationRadius || query.locationRadius;

        if (coords?.length === 2 && radius > 0) {
            console.log('Searching for places near:', coords, 'radius:', radius, 'km');
            
            const nearbyPlaces = await PlaceModel.find({
                'location.coordinates': {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: coords
                        },
                        $maxDistance: radius * 1000
                    }
                }
            }).select('_id');

            console.log('Found nearby places:', nearbyPlaces.length);

            const nearbyPlaceIds = nearbyPlaces.map(p => p._id);

            if (nearbyPlaceIds.length > 0) {
                filter.places = { $elemMatch: { $in: nearbyPlaceIds } };
            } else {
                // Если нет мест в радиусе, вернуть пустой результат
                return {
                    tracks: [],
                    total: 0,
                    page,
                    pages: 0
                };
            }
        }

        const tracks = await TrackModel
            .find(filter)
            .populate('author', 'email name')
            .populate('places')
            .sort({ createdDate: -1 })
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

    async edit(trackId, trackData, currentUser) {
        const track = await TrackModel.findById(trackId);

        if (!track) {
            throw ApiError.NotFound('Трек не найден');
        }

        const user = await UserModel.findById(currentUser?._id);
        if (!user) {
            throw ApiError.UnauthorizedError();
        }

        const isAuthor = track.author?.toString() === user._id.toString();
        const isAdmin = Array.isArray(user.roles) && user.roles.includes('admin');

        if (!isAuthor && !isAdmin) {
            throw ApiError.NotAccess();
        }
        trackData.isModerated = false;
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

        return { message: 'Трек успешно удалён' };
    }

    async moderate(id) {


        const track = await TrackModel.findById(id);
        if (!track) {
            throw ApiError.NotFound('Трек не найден');
        }

        track.isModerated = true;
        track.isRejected = false;

        await track.save();

        return await track.populate(['author', 'places']);
    }
}

module.exports = new TrackService();
