// here all imports
const Router = require('express').Router

// here all controllers
const tripController = require('../controllers/trip-controller')

const upload = require('../middleware/multer-middleware')

const router = Router()


// here all routes
router.get('/get-all', tripController.getAll)
router.get('/get-by-id', tripController.getById)
router.post('/delete-by-id', tripController.deleteById)
router.post('/create', tripController.create)
router.post('/upload-images', upload.any(), tripController.uploadImages)
router.get('/clear', tripController.clear)

module.exports = router