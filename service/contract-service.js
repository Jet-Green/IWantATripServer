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
        let userUpdate = await UserModel.findOneAndUpdate({ email: contractEmail }, { tinkoffContract: contractId })
        if (!userUpdate) {
            return { code: 201, message: 'Нет такого пользователя' }
        }

        let result = {
            code: 200,
            message: 'ok',
            data: null
        }
        result.data = await ContractModel.findByIdAndUpdate(contractId, { $push: { userEmails: contractEmail } })

        return result
    },
    async deleteContractEmail({ _id: contractId, email: contractEmail }) {
        let userUpdate = await UserModel.findOneAndUpdate({ email: contractEmail }, { tinkoffContract: null })
        if (!userUpdate) {
            return { code: 201, message: 'Нет такого пользователя' }
        }
        let result = {
            code: 200,
            message: 'ok',
            data: null
        }

        result.data = await ContractModel.findByIdAndUpdate(contractId, { $pull: { userEmails: contractEmail } })

        return result
    }
}