const BillModel = require('../models/bill-model.js')

module.exports = {
    async createBill(bill, tripId) {
        try {
            bill.tripId = tripId
            return await BillModel.create(bill)
        } catch (error) {
            next(error)
        }
    }
}