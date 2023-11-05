const Router = require('express').Router
const authMiddleware = require('../middleware/auth-middleware')

const ContractController = require('../controllers/contract-controller')


const router = Router()

router.post('/create', authMiddleware, ContractController.createContract)

module.exports = router