const Router = require('express').Router
const paymentController = require('../controllers/payment-controller')

const router = Router()

router.post('/tinkoff-notification', paymentController.tinkoffNotification)

module.exports = router
