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
router.get('/get-all-catalog', tripController.getCatalog)
router.post('/search', tripController.search)
router.get('/get-by-id', tripController.getById)
router.post('/get-my-catalog-trips', authMiddleware, tripController.getMyCatalogTrips)
router.post('/delete-by-id', tripController.deleteById)
router.post('/delete-catalog-by-id', tripController.deleteCatalogById)
router.post('/create', authMiddleware, tripController.create)
router.post('/create-catalog-trip', authMiddleware, tripController.createCatalogTrip)
router.post('/booking', tripController.booking)
router.post('/update', authMiddleware, tripController.update)
router.post('/update-catalog-trip', authMiddleware, tripController.updateCatalogTrip)
router.get('/hide', authMiddleware, tripController.hideTrip)
router.get('/hide-catalog', authMiddleware, tripController.hideCatalogTrip)
router.post('/upload-images', MULTER().any(), tripController.uploadImages)
router.post('/upload-catalog-images', MULTER().any(), tripController.uploadCatalogImages)

router.post('/upload-pdf', MULTER().any(), tripController.uploadPdf)
router.get('/clear', tripController.clear)
router.get('/created-trips-info', tripController.createdTripsInfo)

router.get('/get-full-trip', tripController.getFullTripById)
router.get('/get-full-catalog', tripController.getFullCatalogById)

router.get('/catalog-trips', tripController.getCatalogTrips)

router.post('/set-payment', tripController.setPayment)
router.get('/delete-payment', tripController.deletePayment)

router.post('/update-bills-tourists', tripController.updateBillsTourists)
router.post('/update-partner', tripController.updatePartner)
router.post('/update-iscatalog', tripController.updateIsCatalog)

router.post('/create-many-by-dates', tripController.createManyByDates)
router.post('/update-included-locations', tripController.updateIncludedLocations)

router.post('/update-transports', tripController.updateTransports)
router.post('/find-trip-by-name', tripController.findTripsByName)

router.put('/set-user-comment', tripController.setUserComment)
router.put('/bill-user-comment', tripController.editBillUserComment)

router.get('/bought', tripController.getBoughtTrips)

router.get('/catalog', tripController.getCatalogTripById)

router.post('/move-to-catalog', tripController.moveToCatalog)

router.post('/my-catalog-on-moderation', tripController.myCatalogOnModeration)

module.exports = router