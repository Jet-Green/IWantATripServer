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

    /**
     * Публичные сведения о продавце — для страницы «Тур предоставляется
     * компанией», которую открывают и без входа в аккаунт.
     *
     * Только то, что покупатель вправе знать о продавце и что и так открыто
     * в ЕГРЮЛ: наименование, ИНН, КПП, ОГРН, ОКВЭД, адреса, сайт.
     * Полная запись договора (руководитель с личным телефоном, учредители,
     * банковские реквизиты) остаётся в getByShopCode — она нужна для печати
     * договора в кабинете и отдаётся только авторизованным.
     */
    getPublicByShopCode(shopCode) {
        return ContractModel.findOne(
            { 'shopInfo.shopCode': Number(shopCode) },
            { name: 1, fullName: 1, inn: 1, kpp: 1, ogrn: 1, okved: 1, addresses: 1, siteUrl: 1 }
        ).lean()
    }


}