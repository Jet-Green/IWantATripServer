// here all imports
const Router = require('express').Router
const multer = require('../middleware/multer-middleware')
const upload = multer.upload

// here all controllers
const guideController = require('../controllers/guide-controller')


const router = Router()


// here all routes
router.get('/get-all-elements', guideController.getAllElements)
router.get('/get-by-id', guideController.getById)
router.post('/delete-by-id', guideController.deleteById)
router.post('/create-element', guideController.createGuideElement)
router.post('/upload-image', upload.any(), guideController.uploadImages)
router.post('/set-taxi', guideController.setTaxi)
router.post('/delete-taxi', guideController.deleteTaxi)
router.post('/get-local-taxi', guideController.getLocalTaxi)
// router.get('/clear', guideController.clear)

module.exports = router