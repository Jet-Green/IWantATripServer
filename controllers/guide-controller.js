const data = {
    toWatch: [
        {
            _id: 'fsjfjsdkjgfj',
            image: 'https://glazov-flash.ru/image/cache/catalog/gorod/poest/sochy/sochi-350x200.png',
            name: 'Кафе "Сочи"',
            address: 'Глазов, ул. Кирова, 11А',
            phone: '+7 (922) 508-00-80, +7 (34141) 2-78-55, +7 (965) 845-85-46',
            socialMedia: 'https://vk.com/sochi_cafe_glazov',
            description: 'Излюбленное кафе города с дизайнерским оформлением и отличной кухней.'
        },
        {
            _id: '123yhfuhnvrf',
            image: 'https://glazov-flash.ru/image/cache/catalog/gorod/posmotret/idnakar/idnakar3-350x200.jpg',
            name: 'Историко-культурный музей «Иднакар»',
            address: 'ул. Советская, 27',
            phone: '8 (34141)3-55-33',
            socialMedia: 'e-mail: idnakar_visit@bk.ru',
            description: ''
        },
        {
            _id: '123yhunvdufb',
            image: 'https://glazov-flash.ru/image/cache/catalog/gorod/posmotret/idnakar/idnakar3-350x200.jpg',
            name: 'Историко-культурный музей «Иднакар»',
            address: 'ул. Советская, 27',
            phone: '8 (34141)3-55-33',
            socialMedia: 'e-mail: idnakar_visit@bk.ru',
            description: ''
        },
        {
            _id: '9132ujrfimvgk',
            image: 'https://glazov-flash.ru/image/cache/catalog/gorod/posmotret/idnakar/idnakar3-350x200.jpg',
            name: 'Историко-культурный музей «Иднакар»',
            address: 'ул. Советская, 27',
            phone: '8 (34141)3-55-33',
            socialMedia: 'e-mail: idnakar_visit@bk.ru',
            description: ''
        },
    ]
}

const GuideService = require('../service/guide-service')
const logger = require('../logger.js');

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
    async getById(req, res, next) {
        try {
            return res.json(data.toWatch.find((e) => e._id == req.query._id))
        } catch (error) {
        }
    },
    async deleteById(req, res, next) {
        try {
            const _id = req.body._id

            GuideService.deleteOne(_id);
        } catch (error) {
        }
    },
    async deleteGuide(req, res, next) {
        try {
            const _id = req.body._id
            // console.log(_id,req.body)
            return await GuideService.deleteGuide(_id);
        } catch (error) {
        }
    },
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
          
            res.json(await GuideService.getGuides(req.body.query,req.body.dbSkip))
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
}