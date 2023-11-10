const ContractModel = require('../models/contract-model.js')
const UserModel = require('../models/user-model.js')

module.exports = {
    async createContract({ contract, userEmail }) {
        let contractFromDb = await ContractModel.create({ ...contract, userEmail: userEmail })

        await UserModel.findOneAndUpdate({ email: userEmail }, { $push: { contracts: contractFromDb._id } })

        return contractFromDb
    },
    async getAll() {
        return ContractModel.find({})
    }
}