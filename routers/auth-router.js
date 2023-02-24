const Router = require('express').Router
const userController = require('../controllers/user-controller')


const router = Router()

router.post('/buy-trip', userController.buyTrip)


router.post('/registration', userController.registration)
router.post('/login', userController.login)
router.get('/refresh', userController.refresh)
router.post('/logout', userController.logout)
router.post('/update', userController.update)

router.post('/forgot-password', userController.sendResetLink)
router.post('/reset-password', userController.resetPassword)

router.get('/clear-users', userController.clearUsers)

module.exports = router