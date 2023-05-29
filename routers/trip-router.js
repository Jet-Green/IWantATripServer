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
router.post('/get-user-trips', tripController.getUserTrips)
router.post('/get-customers', tripController.getCustomers)
router.post('/buy-trip', tripController.buyTrip)
router.get('/get-all', tripController.getAll)
router.post('/search', tripController.search)
router.get('/get-by-id', tripController.getById)
router.post('/delete-by-id', tripController.deleteById)
router.post('/create', authMiddleware, tripController.create)
router.post('/booking', tripController.booking)
router.post('/update', authMiddleware, tripController.update)
router.get('/hide', authMiddleware, tripController.hideTrip)
router.get('/moderate', authMiddleware, tripController.moderateTrip)
router.post('/upload-images', MULTER().any(), tripController.uploadImages)
router.post('/upload-pdf', MULTER().any(), tripController.uploadPdf)
router.get('/clear', tripController.clear)
router.get('/created-trips-info', tripController.createdTripsInfo)

module.exports = router