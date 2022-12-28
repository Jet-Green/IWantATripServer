// here all imports
const Router = require('express').Router
const multer = require('../middleware/multer-middleware')
const upload = multer.upload

// here all controllers
const bookingController = require('../controllers/booking-controller')


const router = Router()


// here all routes

router.post('/create-element', bookingController.createBookingElement)


module.exports = router