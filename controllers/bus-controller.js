const busModel = require("../models/bus-model")

module.exports = {
    async get(req, res, next) {
        try {
            let buses = await busModel.find({ $or: [{ hidden: { $exists: false } }, { hidden: false }] })
            res.status(200).json(buses)
        } catch (error) {
            next(error)
        }
    },    
    async getById(req, res, next) {
        try {
            let buses = await busModel.findById(req.query._id)
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
    },
    async deleteBus(req, res, next) {
        try {
            await busModel.findByIdAndUpdate(req.query._id, { hidden: true })
            res.sendStatus(200)
        } catch (error) {
            next(error)
        }
    }
}