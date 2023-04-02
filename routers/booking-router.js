// here all imports
const Router = require('express').Router

// here all controllers
const bookingController = require('../controllers/booking-controller')


const router = Router()


// here all routes

router.post('/create', bookingController.create)
router.post('/findByUserId', bookingController.findByUserId)


module.exports = router