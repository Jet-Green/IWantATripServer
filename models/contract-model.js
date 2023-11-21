const { Schema, model } = require('mongoose')

const ContractSchema = new Schema({
    name: { type: String },
    inn: { type: String },
    kpp: { type: String },
    ogrn: { type: String },
    yr_address: { type: String },
    fact_address: { type: String },
    checking_account: { type: String },
    checking_account_bank: { type: String },
    cash_account: { type: String },
    cash_account_bank: { type: String },
    bik: { type: String },
    phone: { type: String },
    email: { type: String },
    director: { type: String },

    userEmail: String
})

module.exports = model('Contract', ContractSchema);