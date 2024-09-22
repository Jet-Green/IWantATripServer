// here all imports
const Router = require('express').Router

// here all controllers
const catalogController = require('../controllers/catalog-controller')

const authMiddleware = require('../middleware/auth-middleware')

const MULTER = require('multer')
const multer = require('../middleware/multer-middleware')
const upload = multer.upload
const router = Router()


// here all routes
router.get('/get-all-catalog', catalogController.getCatalog)
router.post('/get-my-catalog-trips', authMiddleware, catalogController.getMyCatalogTrips)

router.post('/delete-catalog-by-id', catalogController.deleteCatalogById)
router.post('/create-catalog-trip', authMiddleware, catalogController.createCatalogTrip)
router.post('/update-catalog-trip', authMiddleware, catalogController.updateCatalogTrip)
router.post('/edit-catalog-trip', authMiddleware, catalogController.editCatalogTrip)

router.get('/hide-catalog', authMiddleware, catalogController.hideCatalogTrip)
router.post('/upload-catalog-images', MULTER().any(), catalogController.uploadCatalogImages)

router.get('/get-full-catalog', catalogController.getFullCatalogById)

router.get('/catalog-trips', catalogController.getCatalogTrips)

router.get('/catalog', catalogController.getCatalogTripById)

router.post('/move-to-catalog', catalogController.moveToCatalog)

router.post('/my-catalog-on-moderation', catalogController.myCatalogOnModeration)

// not realisated func
router.get('/catalog-trips-on-moderation', catalogController.myCatalogOnModeration)

module.exports = router