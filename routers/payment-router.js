const Router = require('express').Router
const paymentController = require('../controllers/payment-controller')
const yookassaController = require('../controllers/yookassa-controller')
const authMiddleware = require('../middleware/auth-middleware')
const managerMiddleware = require('../middleware/manager-middleware')
const realEmailMiddleware = require('../middleware/real-email-middleware')
const yookassaIpMiddleware = require('../middleware/yookassa-ip-middleware')

const router = Router()

router.post('/tinkoff-notification', paymentController.tinkoffNotification)

// Создание платежа в Т‑Банке: раньше браузер ходил в эквайринг сам, с паролем
// терминала прямо в коде страницы. С 22.06.2026 банк перешёл на сертификат
// российского УЦ, которого нет у большинства браузеров, и оплата молча перестала
// работать. Теперь в банк ходит только сервер.
router.post('/tinkoff/trip-payment', authMiddleware, paymentController.tripPayment)
router.post('/tinkoff/excursion-payment', authMiddleware, paymentController.excursionPayment)
router.post('/tinkoff/state', authMiddleware, paymentController.paymentState)
router.post('/tinkoff/cancel', authMiddleware, managerMiddleware, paymentController.cancelPayment)
router.post('/yookassa/webhook', yookassaIpMiddleware, yookassaController.webhook)
router.post('/yookassa/trip-payment', authMiddleware, realEmailMiddleware, yookassaController.createTripPayment)

module.exports = router
