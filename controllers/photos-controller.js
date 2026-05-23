const PhotosService = require('../service/photos-service')

module.exports = {
    async getPhotos(req, res, next) {
    
        try {

            const { page, lon, lat, location, locationRadius } = req.query;
            const geo =
                lon != null || lat != null || location != null || locationRadius != null
                    ? { lon, lat, location, locationRadius }
                    : null;
            return res.json(await PhotosService.getPhotos(page, geo))
        } catch (error) {
            next(error)
        }
    },

    async searchPhotobank(req, res, next) {
        try {
            const { q, page, lon, lat, location, locationRadius } = req.query;
            const geo =
                lon != null || lat != null || location != null || locationRadius != null
                    ? { lon, lat, location, locationRadius }
                    : null;
            return res.json(
                await PhotosService.searchPhotos(q, page, geo)
            );
        } catch (error) {
            if (error.statusCode === 400) {
                return res.status(400).json({ message: error.message });
            }
            next(error);
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
            let metadataList = [];
            const rawMeta = req.body?.photobankMetadata;
            if (rawMeta != null && String(rawMeta).trim()) {
                try {
                    const parsed = JSON.parse(String(rawMeta));
                    metadataList = Array.isArray(parsed) ? parsed : [];
                } catch {
                    return res.status(400).json({ message: 'Некорректный photobankMetadata (ожидается JSON-массив)' });
                }
            }
            const urls = await PhotosService.uploadPhotobankPhotos(req.files, userId, metadataList);
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

    async findPhotosOnModeration(req, res, next) {
        try {
            return res.json(await PhotosService.findPhotosOnModeration());
        } catch (error) {
            next(error);
        }
    },

    async findRejectedPhotos(req, res, next) {
        try {
            return res.json(await PhotosService.findRejectedPhotos());
        } catch (error) {
            next(error);
        }
    },

    async getPhotoById(req, res, next) {
        try {
            const _id = req.query._id;
            if (!_id) {
                return res.status(400).json({ message: 'Не указан _id' });
            }
            return res.json(await PhotosService.getPhotoById(_id));
        } catch (error) {
            if (error.statusCode === 404) {
                return res.status(404).json({ message: error.message });
            }
            next(error);
        }
    },

    async moderatePhoto(req, res, next) {
        try {
            const _id = req.query._id;
            if (!_id) {
                return res.status(400).json({ message: 'Не указан _id' });
            }
            return res.json(await PhotosService.moderatePhoto(_id));
        } catch (error) {
            if (error.statusCode === 404) {
                return res.status(404).json({ message: error.message });
            }
            next(error);
        }
    },

    async rejectPhoto(req, res, next) {
        try {
            const _id = req.query._id;
            if (!_id) {
                return res.status(400).json({ message: 'Не указан _id' });
            }
            const msg = req.body?.msg ?? req.body?.moderationMessage ?? '';
            return res.json(await PhotosService.rejectPhoto(_id, msg));
        } catch (error) {
            if (error.statusCode === 404) {
                return res.status(404).json({ message: error.message });
            }
            next(error);
        }
    },

    async deletePhoto(req, res, next) {
        try {
            const _id = req.query._id;
            if (!_id) {
                return res.status(400).json({ message: 'Не указан _id' });
            }
            return res.json(await PhotosService.deletePhoto(_id));
        } catch (error) {
            if (error.statusCode === 404) {
                return res.status(404).json({ message: error.message });
            }
            next(error);
        }
    },

    async findMyPhotos(req, res, next) {
        try {
            const userId =
                req.user?._id != null
                    ? String(req.user._id)
                    : req.user?.id != null
                      ? String(req.user.id)
                      : '';
            if (!userId) {
                return res.status(401).json({ message: 'Не удалось определить пользователя' });
            }
            const status = req.query.status;
            const page = req.query.page;
            return res.json(await PhotosService.getMyPhotos(userId, status, page));
        } catch (error) {
            if (error.statusCode === 401) {
                return res.status(401).json({ message: error.message });
            }
            next(error);
        }
    },

    async filterPublishedUrls(req, res, next) {
        try {
            const urls = Array.isArray(req.body?.urls) ? req.body.urls : [];
            return res.json({
                urls: await PhotosService.filterPublishedPhotobankUrls(urls),
            });
        } catch (error) {
            next(error);
        }
    },

    async deleteMyPhoto(req, res, next) {
        try {
            const userId =
                req.user?._id != null
                    ? String(req.user._id)
                    : req.user?.id != null
                      ? String(req.user.id)
                      : '';
            if (!userId) {
                return res.status(401).json({ message: 'Не удалось определить пользователя' });
            }
            const _id = req.query._id;
            if (!_id) {
                return res.status(400).json({ message: 'Не указан _id' });
            }
            return res.json(await PhotosService.deleteMyPhoto(userId, _id));
        } catch (error) {
            if (error.statusCode === 401) {
                return res.status(401).json({ message: error.message });
            }
            if (error.statusCode === 404) {
                return res.status(404).json({ message: error.message });
            }
            if (error.statusCode === 400) {
                return res.status(400).json({ message: error.message });
            }
            next(error);
        }
    },

    async updateMyPhoto(req, res, next) {
        try {
            const userId =
                req.user?._id != null
                    ? String(req.user._id)
                    : req.user?.id != null
                      ? String(req.user.id)
                      : '';
            if (!userId) {
                return res.status(401).json({ message: 'Не удалось определить пользователя' });
            }
            const _id = req.query._id;
            if (!_id) {
                return res.status(400).json({ message: 'Не указан _id' });
            }
            return res.json(await PhotosService.updateMyPhoto(userId, _id, req.body));
        } catch (error) {
            if (error.statusCode === 401) {
                return res.status(401).json({ message: error.message });
            }
            if (error.statusCode === 404) {
                return res.status(404).json({ message: error.message });
            }
            if (error.statusCode === 400) {
                return res.status(400).json({ message: error.message });
            }
            next(error);
        }
    },
}