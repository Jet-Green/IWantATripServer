const Router = require('express').Router
const userController = require('../controllers/user-controller')


const router = Router()

router.post('/registration', userController.registration)
router.post('/login', userController.login)
router.get('/refresh', userController.refresh)
router.post('/logout', userController.logout)
router.post('/update', userController.update)

router.get('/clear-users', userController.clearUsers)

module.exports = router