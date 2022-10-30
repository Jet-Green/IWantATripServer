// here all imports
const Router = require('express').Router
const upload = require('../middleware/multer-middleware')

// here all controllers
const guideController = require('../controllers/guide-controller')


const router = Router()


// here all routes
router.get('/get-all-elements', guideController.getAllElements)
router.get('/get-by-id', guideController.getById)
router.post('/create-element', guideController.createGuideElement)
router.post('/upload-image', upload.any(), guideController.uploadImages)
router.get('/clear', guideController.clear)

module.exports = router