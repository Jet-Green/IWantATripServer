const Router = require('express').Router

const router = Router()

const BillModel = require('../models/bill-model')
const tripModel = require('../models/trip-model')

router.get('/add-fullinfo-to-bills', async (req, res) => {
    try {
        await BillModel.updateMany({}, [{ $set: { touristsList: [{ fullname: '$userInfo.fullname', phone: '$userInfo.phone' }] } }])
        res.send().status(200)
    } catch (error) {
        console.log(error);
    }
})

router.get('/add-start-loc-to-incl-trips', async () => {
    try {
        let trips = await tripModel.find({ parent: null })

        for (let trip of trips) {
            if (!(trip.locationNames[0]?._id == trip.startLocation._id)) {
                trip.locationNames = [trip.startLocation]
                trip.includedLocations = {
                    type: 'MultiPoint',
                    coordinates: [trip.startLocation.coordinates]
                }
            }
            await trip.save()
        }
    } catch (error) {
        console.log(error);
    }
})

module.exports = router
