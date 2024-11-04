const placesController = require('../controllers/places-controller')
const authMiddleware = require('../middleware/auth-middleware')

const Router = require('express').Router

const router = Router()

const MULTER = require('multer')
const multer = require('../middleware/multer-middleware')


// get all places
router.post('/get-all', placesController.getAll)
router.post('/create',  authMiddleware, placesController.create)
router.post('/delete',  authMiddleware, placesController.delete)

router.post('/upload-images', MULTER().any(), placesController.uploadImages)

router.get('/for-moderation', placesController.getForModeration)
router.get('/get-by-id', placesController.getById)
router.get('/moderate-place',authMiddleware, placesController.moderatePlace)
router.get('/reject-place',authMiddleware, placesController.rejectPlace)
router.get('/hide-place',authMiddleware, placesController.hidePlace)


module.exports = router