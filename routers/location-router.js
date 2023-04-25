const Router = require('express').Router
const locationController = require('../controllers/location-controller')
const router = Router()

router.get('/get-all', locationController.getLocations)

module.exports = router