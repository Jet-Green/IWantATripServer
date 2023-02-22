const TripService = require('../service/trips-service.js')

let EasyYandexS3 = require('easy-yandex-s3').default;
const { sendMail } = require('../middleware/mailer')

// Указываем аутентификацию в Yandex Object Storage
let s3 = new EasyYandexS3({
    auth: {
        accessKeyId: process.env.YC_KEY_ID,
        secretAccessKey: process.env.YC_SECRET,
    },
    Bucket: process.env.YC_BUCKET_NAME, // Название бакета
    debug: false, // Дебаг в консоли
});

const mailer = require('../middleware/mailer')

module.exports = {
    async getCustomers(req, res, next) {
        try {
            return res.json(await TripService.getCustomers(req.body))
        } catch (error) {
            next(error)
        }
    },
    async getAll(req, res, next) {
        try {
            return res.json(await TripService.findMany())
        } catch (error) {
            next(error)
        }
    },
    async buyTrip(req, res, next) {
        try {
            return res.json(await TripService.buyTrip(req))
        } catch (error) {
            console.log(error);
            next(error)
        }
    },
    async search(req, res, next) {
        try {
            let s = req.body
            return res.json(await TripService.findForSearch(s))
        } catch (error) {
            next(error)
        }
    },
    async getById(req, res, next) {
        try {
            const _id = req.query._id
            return res.json(await TripService.findById(_id));
        } catch (error) {
            next(error)
        }
    },
    async deleteById(req, res, next) {
        try {
            const _id = req.body._id

            return await TripService.deleteOne(_id);
        } catch (error) {
            next(error)
        }
    },
    async clear(req, res, next) {
        try {
            TripService.deleteMany()
        } catch (error) {
            next(error)
        }
    },
    async create(req, res, next) {
        try {
            const tripFromDB = await TripService.insertOne(req.body)

            let trip = Object.assign({}, tripFromDB._doc)

            // format to send the mail
            trip.start = new Date(Number(trip.start)).toLocaleDateString("ru-RU")
            trip.end = new Date(Number(trip.end)).toLocaleDateString("ru-RU")

            sendMail(trip, 'create-trip.hbs')

            return res.json({ _id: trip._id })
        } catch (error) {
            next(error)
        }
    },
    async booking(req, res, next) {
        try {
            const tripCb = await TripService.booking(req.body)

            return res.json({ _id: tripCb._id })
        } catch (error) {
            next(error)
        }
    },
    async update(req, res, next) {
        try {
            const tripCb = await TripService.updateOne(req.body)

            return res.json({ _id: tripCb._id })
        } catch (error) {
            next(error)
        }
    },
    async hideTrip(req, res, next) {
        try {
            await TripService.hide(req.query._id, req.query.v)
            return res.json('OK')
        } catch (error) {
            next(error)
        }
    },
    async moderateTrip(req, res, next) {
        try {
            await TripService.moderate(req.query._id, req.query.v)
            return res.json('OK')
        } catch (error) {
            next(error)
        }
    },
    async uploadImages(req, res, next) {
        try {
            let _id = req.files[0].originalname.split('_')[0]

            let filenames = []
            let buffers = []
            for (let file of req.files) {
                buffers.push({ buffer: file.buffer, name: file.originalname, });    // Буфер загруженного файла
            }

            if (buffers.length) {
                let uploadResult = await s3.Upload(buffers, '/iwat/');

                for (let upl of uploadResult) {
                    filenames.push(upl.Location)
                }
            }

            await TripService.updateTripImagesUrls(_id, filenames)

            res.status(200).send('Ok')
        } catch (error) {
            next(error)
        }
    }
}