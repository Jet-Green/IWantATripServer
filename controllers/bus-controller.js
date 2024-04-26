const busModel = require("../models/bus-model")

module.exports = {
    async get(req, res, next) {
        try {
            let buses = await busModel.find()
            res.status(200).json(buses)
        } catch (error) {
            next(error)
        }
    },    
    async create(req, res, next) {
        try {
            await busModel.create(req.body)
            res.sendStatus(200)
        } catch (error) {
            next(error)
        }
    }
}