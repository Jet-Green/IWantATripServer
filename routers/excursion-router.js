const Router = require('express').Router
const authMiddleware = require('../middleware/auth-middleware')
const MULTER = require('multer')

const ExcursionController = require('../controllers/excursion-controller.js')


const router = Router()
router.post('/create', authMiddleware, ExcursionController.create)
router.post('/edit', authMiddleware, ExcursionController.edit)
router.post('/images', MULTER().any(), authMiddleware, ExcursionController.uploadImages)

router.get('/get-excursions', authMiddleware, ExcursionController.getUserExcursions)
router.get('/time-has-bills', ExcursionController.timeHasBills)

router.post('/dates', authMiddleware, ExcursionController.createDates)
router.post('/add-time', authMiddleware, ExcursionController.addTime)
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
router.post('/comment', ExcursionController.comment)

router.post('/buy', authMiddleware, ExcursionController.buy)
router.post('/buy-with-tinkoff', authMiddleware, ExcursionController.buyWithTinkoff)
router.post('/buy-from-cabinet', authMiddleware, ExcursionController.buyFromCabinet)

router.post('/book', authMiddleware, ExcursionController.book)
router.post('/book-from-cabinet', authMiddleware, ExcursionController.bookFromCabinet)
router.get('/get-on-moderation', ExcursionController.getExcursionsOnModeration)

router.post('/order', authMiddleware, ExcursionController.order)

router.post('/delete-excursion',ExcursionController.deleteExcursion ) 
router.post('/approv-excursion',ExcursionController.approvExcursion ) 
router.get('/delete-bill',ExcursionController.deleteBill)
router.get('/delete-booking',ExcursionController.deleteBooking)



module.exports = router