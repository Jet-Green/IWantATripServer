const photosController = require('../controllers/photos-controller')
const authMiddleware = require('../middleware/auth-middleware')

const Router = require('express').Router

const router = Router()

const MULTER = require('multer')

router.get('/get-photos', photosController.getPhotos)

router.post('/upload-photobank', MULTER().any(), authMiddleware, photosController.uploadPhotobank)

module.exports = router