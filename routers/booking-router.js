// here all imports
const Router = require('express').Router

// here all controllers
const bookingController = require('../controllers/booking-controller')


const router = Router()


// here all routes

router.post('/create', bookingController.create)


module.exports = router