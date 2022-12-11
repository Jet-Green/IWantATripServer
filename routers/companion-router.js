// here all imports
const Router = require('express').Router

// here all controllers
const СompanionController = require('../controllers/companion-controller')
const authMiddleware = require('../middleware/auth-middleware')

const router = Router()


// here all routes
router.get('/get-all', СompanionController.getAll)
router.post('/create', authMiddleware, СompanionController.create)


module.exports = router