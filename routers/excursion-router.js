const Router = require('express').Router
const authMiddleware = require('../middleware/auth-middleware')
const MULTER = require('multer')

const ExcursionController = require('../controllers/excursion-controller.js')


const router = Router()
router.post('/create', authMiddleware, ExcursionController.create)
router.post('/images', MULTER().any(), authMiddleware, ExcursionController.uploadImages)

router.get('/get-excursions', authMiddleware, ExcursionController.getUserExcursions)

router.post('/dates', authMiddleware, ExcursionController.createDates)
router.post('/delete-time', authMiddleware, ExcursionController.deleteTime)
router.post('/delete-date', authMiddleware, ExcursionController.deleteDate)
router.post('/all', ExcursionController.getAll)

router.get('/one', ExcursionController.getExcursionById)
router.get('/with-bills', ExcursionController.getWithBills)
router.get('/with-bookings', ExcursionController.getWithBookings)
router.post('/time-customers', ExcursionController.getTimeCustomers)
router.post('/time-bookings', ExcursionController.getTimeBookings)
router.post('/delete-by-id', ExcursionController.deleteById)
router.post('/hide-by-id', ExcursionController.hideById)

router.post('/buy', authMiddleware, ExcursionController.buy)
router.post('/buy-from-cabinet', authMiddleware, ExcursionController.buyFromCabinet)

router.post('/book', authMiddleware, ExcursionController.book)
router.post('/book-from-cabinet', authMiddleware, ExcursionController.bookFromCabinet)
router.get('/get-on-moderation', ExcursionController.getExcursionsOnModeration)

router.post('/delete-excursion',ExcursionController.deleteExcursion ) 
router.post('/approv-excursion',ExcursionController.approvExcursion ) 
router.get('/delete-bill',ExcursionController.deleteBill)


module.exports = router