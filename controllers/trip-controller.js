const TripService = require('../service/trips-service.js')

module.exports = {
    async getAll(req, res, next) {
        try {
            return res.json(await TripService.findMany())
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

            TripService.deleteOne(_id);
        } catch (error) {
            next(error)
        }
    },
    async clear(req, res, next) {
        try {
            TripService.deleteMany()
        } catch (error) {
            console.log(error);
        }
    },
    async create(req, res, next) {
        try {
            const tripCb = await TripService.insertOne(req.body)

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
            console.log(error);
            next(error)
        }
    },
    async uploadImages(req, res, next) {
        try {
            let filenames = []
            let _id = req.files[0].originalname.split('_')[0]
            // http://localhost:3030/images/dfiifhgjngfdjnfgjkfdg_0.png
            for (let f of req.files) {
                filenames.push(process.env.API_URL + `/images/trips/${f.originalname}`)
            }
            await TripService.updateTripImagesUrls(_id, filenames)

            res.status(200).send('Ok')
        } catch (error) {
            // next(error)
        }
    }
}