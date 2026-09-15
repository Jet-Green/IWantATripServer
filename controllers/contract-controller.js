const ContractService = require('../service/contract-service.js')

module.exports = {

    async deleteContract(req, res, next) {
        try {
            return res.json(await ContractService.deleteContract(req.body))
        } catch (error) {
            next(error)
        }
    },
    async registerContract(req, res, next) {
        try {
            return res.json(await ContractService.registerContract(req.body))
        } catch (error) {
            next(error)
        }
    },
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
            next(error)
        }
    },
    async getContractById(req, res, next) {
        try {
            return res.json(await ContractService.getContractById(req.query._id))
        } catch (error) {
            next(error)
        }
    },
    async getByShopCode(req, res, next) {
        try {
            return res.json(await ContractService.getByShopCode(req.query.shopCode))
        } catch (error) {
            next(error)
        }
    },
    /** Открытые сведения о продавце — доступны без входа */
    async getPublicByShopCode(req, res, next) {
        try {
            const shopCode = Number(req.query.shopCode)
            if (!Number.isFinite(shopCode)) {
                return res.status(400).json({ message: 'Не указан код магазина' })
            }
            return res.json(await ContractService.getPublicByShopCode(shopCode))
        } catch (error) {
            next(error)
        }
    },
    
}