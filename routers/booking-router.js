// here all imports
const Router = require('express').Router
const authMiddleware = require('../middleware/auth-middleware')
const AdminController = require('../controllers/admin-controller')
// here all controllers
const bookingController = require('../controllers/booking-controller')


const router = Router()


// here all routes

router.post('/create', authMiddleware, bookingController.create)
router.post('/findByUserId', authMiddleware, bookingController.findByUserId)
router.get('/get-by-status', authMiddleware, bookingController.getByStatus)
router.get('/change-status', authMiddleware, bookingController.changeStatus)
router.post('/update-booking', authMiddleware, bookingController.updateBooking)
router.post('/offer-trip', bookingController.offerTrip)
router.post('/offers', bookingController.getOffersByBookingId)

router.post('/accept-offer', authMiddleware, bookingController.acceptOffer)
router.post('/reject-offer', authMiddleware, bookingController.rejectOffer)
router.post('/to-new-offer', authMiddleware, bookingController.toNewOffer)
router.get('/delete-order', authMiddleware, bookingController.deleteOrder)

module.exports = router