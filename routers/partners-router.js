const partnersController = require('../controllers/partners-controller')
const authMiddleware = require('../middleware/auth-middleware')

const Router = require('express').Router

const router = Router()

const MULTER = require('multer')
const multer = require('../middleware/multer-middleware')


// get all partners
router.post('/get-all', partnersController.getAll)
router.post('/create',  authMiddleware, partnersController.create)
router.post('/delete',  authMiddleware, partnersController.delete)
router.post('/edit',  authMiddleware, partnersController.edit)
router.get('/get-by-id', partnersController.getById)
router.get('/for-create-trip', authMiddleware, partnersController.getForCreateTrip)


module.exports = router