// here all imports
const Router = require('express').Router

// here all controllers
const tripController = require('../controllers/trip-controller')

const authMiddleware = require('../middleware/auth-middleware')

const MULTER = require('multer')
const multer = require('../middleware/multer-middleware')
const upload = multer.upload
const router = Router()


// here all routes
router.post('/get-customers', tripController.getCustomers)
router.post('/buy-trip', authMiddleware, tripController.buyTrip)
router.post('/pay-tinkoff', authMiddleware, tripController.payTinkoffBill)

router.get('/get-all', tripController.getAll)
router.post('/search', tripController.search)
router.get('/get-by-id', tripController.getById)

router.post('/delete-by-id', tripController.deleteById)
router.post('/create', authMiddleware, tripController.create)
router.post('/booking', tripController.booking)

router.post('/update', authMiddleware, tripController.update)
router.get('/hide', authMiddleware, tripController.hideTrip)

router.post('/upload-images', MULTER().any(), tripController.uploadImages)
router.post('/upload-pdf', MULTER().any(), tripController.uploadPdf)

router.get('/clear', tripController.clear)
router.get('/created-trips-info', tripController.createdTripsInfo)

router.get('/get-full-trip', tripController.getFullTripById)

router.get('/get-bought-seats', tripController.getBoughtSeats)

router.post('/set-payment', tripController.setPayment)
router.get('/delete-payment', tripController.deletePayment)

router.post('/update-bills-tourists', tripController.updateBillsTourists)
router.post('/update-partner', tripController.updatePartner)

router.post('/create-many-by-dates', tripController.createManyByDates)
router.post('/update-included-locations', tripController.updateIncludedLocations)

router.post('/update-transports', tripController.updateTransports)
router.post('/find-trip-by-name', tripController.findTripsByName)

router.put('/set-user-comment', tripController.setUserComment)
router.put('/bill-user-comment', tripController.editBillUserComment)

router.get('/bought', tripController.getBoughtTrips)

module.exports = router