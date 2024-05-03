const Router = require('express').Router
const authMiddleware = require('../middleware/auth-middleware')
const MULTER = require('multer')

const ExcursionController = require('../controllers/excursion-controller.js')


const router = Router()
router.post('/', authMiddleware, ExcursionController.create)
router.post('/images', MULTER().any(), ExcursionController.uploadImages)
router.get('/', authMiddleware, ExcursionController.getById)
router.get('/get-excursions', authMiddleware, ExcursionController.getUserExcursions)

router.post('/dates', authMiddleware, ExcursionController.createDates)
router.post('/all', authMiddleware, ExcursionController.getAll)

router.get('/date', ExcursionController.getDateById)

module.exports = router