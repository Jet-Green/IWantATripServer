const Router = require('express').Router
const paymentController = require('../controllers/payment-controller')
const yookassaController = require('../controllers/yookassa-controller')
const authMiddleware = require('../middleware/auth-middleware')

const router = Router()

router.post('/tinkoff-notification', paymentController.tinkoffNotification)
router.post('/yookassa/webhook', yookassaController.webhook)
router.post('/yookassa/trip-payment', authMiddleware, yookassaController.createTripPayment)

module.exports = router
