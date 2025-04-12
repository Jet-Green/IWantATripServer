const placesController = require('../controllers/places-controller')
const authMiddleware = require('../middleware/auth-middleware')
const adminMiddleware = require('../middleware/admin-middleware')
const managerMiddleware = require('../middleware/manager-middleware')

const Router = require('express').Router

const router = Router()

const MULTER = require('multer')
const multer = require('../middleware/multer-middleware')


// get all places
router.post('/get-all', placesController.getAll)
router.post('/create',  authMiddleware, placesController.create)
router.post('/delete',  authMiddleware, placesController.delete)
router.post('/edit',  authMiddleware, placesController.edit)

router.post('/upload-images', MULTER().any(), placesController.uploadImages)

router.get('/for-moderation',managerMiddleware, placesController.getForModeration)
router.get('/get-by-id', placesController.getById)
router.get('/moderate-place',managerMiddleware, placesController.moderatePlace)
router.get('/reject-place',managerMiddleware, placesController.rejectPlace)
router.get('/hide-place',authMiddleware, placesController.hidePlace)

router.get('/for-create-trip', authMiddleware, placesController.getForCreateTrip)


module.exports = router