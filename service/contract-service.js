const ContractModel = require('../models/contract-model.js')

module.exports = {
    createContract({ contract }) {
        return ContractModel.create(contract)
    }
}