const Router = require('express').Router

const router = Router()

const BillModel = require('../models/bill-model')

router.get('/add-fullinfo-to-bills', async (req, res) => {
    try {
        await BillModel.updateMany({}, [{ $set: { touristsList: [{ fullname: '$userInfo.fullname', phone: '$userInfo.phone' }] } }])
        res.send().status(200)
    } catch (error) {
        console.log(error);
    }
})

module.exports = router
