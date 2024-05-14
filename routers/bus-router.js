const busController = require('../controllers/bus-controller')
const authMiddleware = require('../middleware/auth-middleware')
const Router = require('express').Router
const router = Router()

router.get('/get', busController.get)
router.get('/get-by-id', busController.getById)
router.post('/create', authMiddleware, busController.create)
router.delete('/delete', busController.deleteBus)

module.exports = router