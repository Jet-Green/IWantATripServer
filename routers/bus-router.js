const busController = require('../controllers/bus-controller')
const authMiddleware = require('../middleware/auth-middleware')
const Router = require('express').Router
const router = Router()

router.get('/get', busController.get)
router.post('/create', authMiddleware, busController.create)

module.exports = router