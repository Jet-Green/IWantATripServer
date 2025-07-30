

const GuideService = require('../service/guide-service')
const logger = require('../logger.js');
const ApiError = require('../exceptions/api-error.js')
const tokenService = require("../service/token-service");

module.exports = {
    async getAllElements(req, res, next) {
        try {
            let r = await GuideService.getAllElements(req.query.name)
            return res.json(r)
        } catch (err) {
            // when api error enabled
            // next(err)
        }
    },
    // async getById(req, res, next) {
    //     try {
    //         return res.json(data.toWatch.find((e) => e._id == req.query._id))
    //     } catch (error) {
    //     }
    // },
    async deleteById(req, res, next) {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        const userData = tokenService.validateAccessToken(token);
        if (!userData) {
            throw ApiError.UnauthorizedError();
        }

        try {
            const _id = req.body._id
            logger.info({ guideId: _id, logType: 'guide' }, `удален пользователем ${userData._id}`)
            return res.json(await GuideService.deleteById(_id))
        } catch (error) {
            next(error)
        }
    },
    // async deleteGuide(req, res, next) {
    //     try {
    //         return res.json(await GuideService.deleteGuide(req.body._id))
    //     } catch (error) {
    //     }
    // },
    async createGuideElement(req, res, next) {
        try {
            let guideCb = await GuideService.createElement(req.body)
            // вызвать сервис, который будет сохранять в БД
            return res.json({ _id: guideCb._id })
        } catch (err) {
            // when api error enabled
            // next(err)
        }
    },
    async uploadImage(req, res, next) {
        try {
            let _id = req.files[0].originalname.split('_')[0]
            let filename = process.env.API_URL + '/guide-elements/' + _id + '_0.png';
            await GuideService.updateGuideElementImage(_id, filename)

            res.status(200).send('OK')
        } catch (error) {
        }
    },
    async clear() {
        try {
            await GuideService.clear()
        } catch (error) {
        }
    },
    async deleteTaxi(req, res, next) {
        try {
            return res.json(await GuideService.deleteTaxi(req.body))
        } catch (error) {
            next(error)
        }
    },
    async setTaxi(req, res, next) {
        try {

            res.json(await GuideService.setTaxi(req.body.taxi))
        } catch (err) {
            next(err)
        }
    },

    async getLocalTaxi(req, res, next) {
        try {

            res.json(await GuideService.getLocalTaxi(req.body.location))
        } catch (err) {
            next(err)
        }
    },
    async addGuide(req, res, next) {
        try {

            res.json(await GuideService.addGuide(req.body.guide))
        } catch (err) {
            next(err)
        }
    },
    async getGuides(req, res, next) {
        try {

            res.json(await GuideService.getGuides(req.body.page,req.body.filter))
        } catch (err) {
            next(err)
        }
    },
    async getGuidesByUserId(req, res, next) {
        try {
            res.json(await GuideService.getGuidesByUserId(req.body))
        } catch (err) {
            next(err)
        }
    },
    async updateGuide(req, res, next) {
        try {

            res.json(await GuideService.updateGuide(req.body.guide))
        } catch (err) {
            next(err)
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
            let uploadResult = await s3.Upload(buffers, '/iwat/guides/');

            for (let upl of uploadResult) {
                filenames.push(upl.Location)
            }
        }

        if (filenames.length) {
            await GuideService.pushGuideImagesUrls(_id, filenames[0])
            logger.info({ filenames, logType: 'place' }, 'images uploaded')
        }

        res.status(200).send('Ok')
    },
    async getGuideByEmail(req, res, next) {
        try {
            res.json(await GuideService.getGuideByEmail(req.body.email))
        } catch (err) {
            next(err)
        }
    },
    async getGuideById(req, res, next) {
        try {
            res.json(await GuideService.getGuideById(req.body._id))
        } catch (err) {
            next(err)
        }
    },
    async getGuideExcursions(req, res, next) {
        try {
            res.json(await GuideService.getGuideExcursions(req.body._id))
        } catch (err) {
            next(err)
        }
    },
    async moderateGuide(req, res, next) {
        try {
            res.json(await GuideService.moderateGuide(req.body._id))
        } catch (err) {
            next(err)
        }
    },
    async hideGuide(req, res, next) {
        try {
            res.json(await GuideService.hideGuide(req.body._id,req.body.isHidden))
        } catch (err) {
            next(err)
        }
    },
    async sendGuideModerationMessage(req, res, next) {
        try {
            res.json(await GuideService.sendGuideModerationMessage(req.body._id, req.body.msg))
        } catch (err) {
            next(err)
        }
    },
    async getGuidesAutocomplete(req, res, next) {
        try {
            res.json(await GuideService.getGuidesAutocomplete(req.body.query))
        } catch (err) {
            next(err)
        }
    },
}