const placesController = require('../controllers/places-controller')
const authMiddleware = require('../middleware/auth-middleware')

const Router = require('express').Router

const router = Router()

const MULTER = require('multer')
const multer = require('../middleware/multer-middleware')


// get all places
router.post('/get-all', placesController.getAll)

router.post('/create',  authMiddleware, placesController.create)
router.post('/upload-images', MULTER().any(), placesController.uploadImages)

module.exports = router