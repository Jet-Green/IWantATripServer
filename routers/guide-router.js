// here all imports
const Router = require('express').Router
const MULTER = require('multer')
const multer = require('../middleware/multer-middleware')
const upload = multer.upload
// here all controllers
const guideController = require('../controllers/guide-controller')
const authMiddleware = require('../middleware/auth-middleware')
const permissionMiddleware = require('../middleware/permission-middleware')

const router = Router()


// here all routes
router.get('/get-all-elements', guideController.getAllElements)
// router.get('/get-by-id', guideController.getById)
router.post('/delete-by-id', authMiddleware, guideController.deleteById)
// router.post('/delete-guide', guideController.deleteGuide)
router.post('/create-element', guideController.createGuideElement)
router.post('/upload-image', upload.any(), guideController.uploadImage)
router.post('/set-taxi', guideController.setTaxi)
router.post('/add-guide',authMiddleware, guideController.addGuide)
router.post('/update-guide',authMiddleware, guideController.updateGuide)
router.post('/get-guides', guideController.getGuides)
router.post('/get-guides-by-user-id',authMiddleware, guideController.getGuidesByUserId)
router.post('/upload-images', MULTER().any(), guideController.uploadImages)
router.post('/get-guide-by-email', guideController.getGuideByEmail)
router.post('/get-guide-by-id', guideController.getGuideById)
router.post('/get-guide-excursions', guideController.getGuideExcursions)
router.post('/moderate-guide',authMiddleware, guideController.moderateGuide)
router.post('/hide-guide', guideController.hideGuide)
router.post('/send-guide-moderation-message', guideController.sendGuideModerationMessage)
router.post('/get-guides-autocomplete',guideController.getGuidesAutocomplete)
router.post('/delete-taxi', guideController.deleteTaxi)
router.post('/get-local-taxi', guideController.getLocalTaxi)
// router.get('/clear', guideController.clear)

module.exports = router