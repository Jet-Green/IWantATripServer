const Router = require('express').Router
const userController = require('../controllers/user-controller')

const { rateLimit } = require('express-rate-limit')

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 5 minutes
	limit: 5, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: async (req, res) => {
	
			return  {message:'Превышен лимит попыток, попробуйте через 15 минут'}
    }
	// store: ... , // Redis, Memcached, etc. See below.
})

const router = Router()

router.post('/buy-trip', userController.buyTrip)


router.post('/registration', userController.registration)
router.post('/login', limiter, userController.login)
router.get('/refresh', userController.refresh)
router.post('/logout', userController.logout)
router.post('/update', userController.update)

router.post('/add-trip-calc', userController.addTripCalc)
router.post('/delete-trip-calc', userController.deleteTripCalc)

router.post('/forgot-password', limiter, userController.sendResetLink)
router.post('/reset-password', limiter, userController.resetPassword)

router.get('/get-bought-trips', userController.getBoughtTrips)

router.post('/cancel-trip', userController.cancelTrip)

router.get('/determine-winner', userController.determineTheWinner)

router.put('/set-trip-calculator', userController.setTripCalculator)

router.put('/fullinfo', userController.updateFullinfo)

module.exports = router