const ContractModel = require('../models/contract-model.js')
const UserModel = require('../models/user-model.js')

module.exports = {
    async createContract({ contract, userEmail }) {
        let contractFromDb = await ContractModel.create({ ...contract, userEmail: userEmail })

        await UserModel.findOneAndUpdate({ email: userEmail }, { $set: { tinkoffContract: contractFromDb._id } })

        return contractFromDb
    },
    async getAll() {
        return ContractModel.find({})
    },
    async addContractEmail({ contractId, contractEmail }) {
        let candidate = await UserModel.findOne({ email: contractEmail })
        if (!candidate) {
            return { code: 400, message: 'Нет такого пользователя' }
        }


        let result = {
            code: 200,
            message: 'ok',
            data: null
        }
        candidate.tinkoffContract = contractId

        try {
            result.data = await candidate.save()
        } catch (error) {
            return { code: 400, message: 'Ошибка при сохранении' }
        }
        return result
    }
}