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
    },
    async addContractEmail(req, res, next) {
        try {
            let result = await ContractService.addContractEmail(req.body)

            return res.status(result.code).json(result)
        } catch (error) {
            next(error)
        }
    },
    async deleteContractEmail(req, res, next) {
        try {
            let result = await ContractService.deleteContractEmail(req.query)

            return res.json(result)
        } catch (error) {
            console.log(error);

            next(error)
        }
    }
}