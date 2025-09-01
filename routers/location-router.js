const Router = require('express').Router
const authMiddleware = require('../middleware/auth-middleware')
const MULTER = require('multer')

const locationController = require('../controllers/location-controller')

const router = Router()

router.get('/get-all', locationController.getAll)
router.get('/search', locationController.searchLocation)
router.post('/select-user-location', locationController.selectUserLocation)
router.post('/create-location',authMiddleware,locationController.createLocation)
router.post('/upload-image', MULTER().any(), authMiddleware, locationController.uploadImage)
router.post('/delete-photo',authMiddleware,locationController.deletePhotoFromLocation)


module.exports = router

module.exports = router