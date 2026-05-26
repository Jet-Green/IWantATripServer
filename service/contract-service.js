const ContractModel = require('../models/contract-model.js')
const UserModel = require('../models/user-model.js')

module.exports = {

    async deleteContract({ _id }) {
        return ContractModel.deleteOne({ _id: _id })
    },

    async registerContract({ contract, userEmail }) {
        let contractFromDb = await ContractModel.create({ ...contract, userEmails: [userEmail] })

        return contractFromDb
    },
    async createContract({ contractId, userEmail, shopInfo }) {
        // let contractFromDb = await ContractModel.create({ ...contract, userEmails: [userEmail] })
        await ContractModel.findByIdAndUpdate({ _id: contractId }, { $set: { shopInfo: shopInfo } })
        await UserModel.findOneAndUpdate({ email: userEmail }, { $set: { tinkoffContract: contractId } })

        return
    },
    async getAll() {
        return ContractModel.find({})
    },
    async addContractEmail({ contractId, contractEmail }) {
        let foundContracts = await ContractModel.find({ userEmails: { $in: contractEmail } })
        if (foundContracts.length > 0) {
            return { code: 201, message: `Уже есть в ${foundContracts[0].name}` }
        }

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
    },
    getContractById(_id) {
        return ContractModel.findById(_id)
    },
    getByShopCode(shopCode) {
       
        let result = ContractModel.findOne({'shopInfo.shopCode':Number(shopCode)});
    
        return result
    },

    async saveYookassaForUser(userId, account_id) {
        const normalized = String(account_id || '').trim()
        if (!/^\d+$/.test(normalized)) {
            const err = new Error('Укажите корректный ShopId (только цифры)')
            err.statusCode = 400
            throw err
        }

        const user = await UserModel.findById(userId).populate('tinkoffContract')
        if (!user?.tinkoffContract) {
            const err = new Error('Сначала оформите договор с платформой (Тинькофф)')
            err.statusCode = 400
            throw err
        }

        const contract = user.tinkoffContract
        const yookassa = {
            account_id: normalized,
            fullName: contract.fullName || contract.name || '',
            inn: contract.inn || '',
            updatedAt: new Date(),
        }

        const updated = await ContractModel.findByIdAndUpdate(
            contract._id,
            { $set: { yookassa }, $unset: { yookassaAccountId: 1 } },
            { new: true }
        )

        return updated
    },
}