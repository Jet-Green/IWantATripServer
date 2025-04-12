const busController = require('../controllers/bus-controller')
const adminMiddleware = require('../middleware/admin-middleware')
const Router = require('express').Router
const router = Router()

router.get('/get', busController.get)
router.get('/get-by-id', busController.getById)
router.post('/create', adminMiddleware, busController.create)
router.delete('/delete',adminMiddleware, busController.deleteBus)

module.exports = router