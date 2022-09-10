const data = {
    toWatch: [
        {
            image: 'https://glazov-flash.ru/image/cache/catalog/gorod/poest/sochy/sochi-350x200.png',
            name: 'Кафе "Сочи"',
            address: 'Глазов, ул. Кирова, 11А',
            phone: '+7 (922) 508-00-80, +7 (34141) 2-78-55, +7 (965) 845-85-46',
            socialMedia: 'https://vk.com/sochi_cafe_glazov',
            description: 'Излюбленное кафе города с дизайнерским оформлением и отличной кухней.'
        },
        {
            image: 'https://glazov-flash.ru/image/cache/catalog/gorod/posmotret/idnakar/idnakar3-350x200.jpg',
            name: 'Историко-культурный музей «Иднакар»',
            address: 'ул. Советская, 27',
            phone: '8 (34141)3-55-33',
            socialMedia: 'e-mail: idnakar_visit@bk.ru',
            description: ''
        },
        {
            image: 'https://glazov-flash.ru/image/cache/catalog/gorod/posmotret/idnakar/idnakar3-350x200.jpg',
            name: 'Историко-культурный музей «Иднакар»',
            address: 'ул. Советская, 27',
            phone: '8 (34141)3-55-33',
            socialMedia: 'e-mail: idnakar_visit@bk.ru',
            description: ''
        },
        {
            image: 'https://glazov-flash.ru/image/cache/catalog/gorod/posmotret/idnakar/idnakar3-350x200.jpg',
            name: 'Историко-культурный музей «Иднакар»',
            address: 'ул. Советская, 27',
            phone: '8 (34141)3-55-33',
            socialMedia: 'e-mail: idnakar_visit@bk.ru',
            description: ''
        },
    ]
}

class GuideController {
    async getAllElements(req, res, next) {
        try {
            let q = req.query;
            return res.json(data[q.name])
        } catch (err) {
            console.log(err);
            // when api error enabled
            // next(err)
        }
    }
}

module.exports = new GuideController();