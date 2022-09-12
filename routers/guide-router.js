// here all imports
const Router = require('express').Router
const upload = require('../middleware/multer-middleware')

// here all controllers
const guideController = require('../controllers/guide-controller')


const router = Router()


// here all routes
router.get('/get-all-elements', guideController.getAllElements)

router.post('/create-element', upload.any(), guideController.createGuideElement)


module.exports = router