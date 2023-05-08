const Router = require('express').Router

const locationController = require('../controllers/location-controller')

const router = Router()

router.get('/get-all', locationController.getAll)
router.get('/search', locationController.searchLocation)
router.post('/select-user-location', locationController.selectUserLocation)

module.exports = router

module.exports = router