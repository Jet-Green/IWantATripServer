const Router = require('express').Router

const locationController = require('../controllers/location-controller')

const router = Router()

router.get('/search', locationController.searchLocation)

module.exports = router

module.exports = router