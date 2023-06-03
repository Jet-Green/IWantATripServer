// here all imports
const Router = require('express').Router

// here all controllers
const СompanionController = require('../controllers/companion-controller')
const authMiddleware = require('../middleware/auth-middleware')

const router = Router()


// here all routes
router.post('/get-all', СompanionController.getAll)
router.get('/get-by-id', СompanionController.getById)
router.get('/clear', СompanionController.clear)
router.post('/create', authMiddleware, СompanionController.create)
router.post('/add-feedback', authMiddleware, СompanionController.addFeedback)


module.exports = router