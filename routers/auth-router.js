const Router = require('express').Router
const userController = require('../controllers/user-controller')


const router = Router()

router.post('/registration', userController.registration)
router.post('/login', userController.login)
router.get('/refresh', userController.refresh)

router.get('/clear-users', userController.clearUsers)

module.exports = router