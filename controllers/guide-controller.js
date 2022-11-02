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

module.exports = {
    async getAllElements(req, res, next) {
        try {
            let r = await GuideService.getAllElements(req.query.name)
            return res.json(r)
        } catch (err) {
            console.log(err);
            // when api error enabled
            // next(err)
        }
    },
    async getById(req, res, next) {
        try {
            return res.json(data.toWatch.find((e) => e._id == req.query._id))
        } catch (error) {
            console.log(error);
        }
    },
    async createGuideElement(req, res, next) {
        try {
            let guideCb = await GuideService.createElement(req.body)
            // вызвать сервис, который будет сохранять в БД
            return res.json({ _id: guideCb._id })
        } catch (err) {
            console.log(err);
            // when api error enabled
            // next(err)
        }
    },
    async uploadImages(req, res, next) {
        try {
            let _id = req.files[0].originalname.split('_')[0]
            let filename = process.env.API_URL + '/guide-elements/' + _id + '_0.png';
            await GuideService.updateGuideElementImage(_id, filename)

            res.status(200).send('OK')
        } catch (error) {
            console.log(error);
        }
    },
    async clear() {
        try {
            await GuideService.clear()
        } catch (error) {
            console.log(error);
        }
    },
}