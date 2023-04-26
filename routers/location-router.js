const Router = require('express').Router
const locationController = require('../controllers/location-controller')

router.get('/search', guideController.getAllElements)
