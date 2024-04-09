const Router = require('express').Router
const authMiddleware = require('../middleware/auth-middleware')

const ExcursionController = require('../controllers/excursion-controller.js')


const router = Router()
router.post('/', authMiddleware, ExcursionController.create)

module.exports = router