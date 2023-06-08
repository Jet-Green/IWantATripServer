// here all imports
const Router = require('express').Router

// here all controllers
const bookingController = require('../controllers/booking-controller')


const router = Router()


// here all routes

router.post('/create', bookingController.create)
router.post('/findByUserId', bookingController.findByUserId)
router.get('/get-by-status', bookingController.getByStatus)

module.exports = router