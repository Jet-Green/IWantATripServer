const Router = require('express').Router
const authMiddleware = require('../middleware/auth-middleware')

const ExcursionController = require('../controllers/excursion-controller.js')


const router = Router()
router.post('/', authMiddleware, ExcursionController.create)
router.get('/', authMiddleware, ExcursionController.getById)
router.get('/get-excursions', authMiddleware, ExcursionController.getUserExcursions)

router.post('/dates', authMiddleware, ExcursionController.createDates)

module.exports = router