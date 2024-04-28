const Router = require('express').Router
const userController = require('../controllers/user-controller')


const router = Router()

router.post('/buy-trip', userController.buyTrip)


router.post('/registration', userController.registration)
router.post('/login', userController.login)
router.get('/refresh', userController.refresh)
router.post('/logout', userController.logout)
router.post('/update', userController.update)

router.post('/add-trip-calc', userController.addTripCalc)
router.post('/delete-trip-calc', userController.deleteTripCalc)

router.post('/forgot-password', userController.sendResetLink)
router.post('/reset-password', userController.resetPassword)

router.get('/clear-users', userController.clearUsers)

router.get('/get-bought-trips', userController.getBoughtTrips)

router.post('/cancel-trip', userController.cancelTrip)

router.get('/determine-winner', userController.determineTheWinner)

// router.post('/show-tour', userController.showTour)
// router.get('/get-tour', userController.getTour)
router.put('/set-trip-calculator', userController.setTripCalculator)

module.exports = router