const ContractService = require('../service/contract-service.js')

module.exports = {
    async createContract(req, res, next) {
        try {
            return res.json(await ContractService.createContract(req.body))
        } catch (error) {
            next(error)
        }
    },
    async getAll(req, res, next) {
        try {
            return res.json(await ContractService.getAll())
        } catch (error) {
            next(error)
        }
    }
}