const Router = require('express').Router
const authMiddleware = require('../middleware/auth-middleware')

const ContractController = require('../controllers/contract-controller')


const router = Router()
router.get('/', authMiddleware, ContractController.getContractById)
router.post('/delete', authMiddleware, ContractController.deleteContract)
router.post('/register', authMiddleware, ContractController.registerContract)
router.post('/create', authMiddleware, ContractController.createContract)
router.post('/get-all', authMiddleware, ContractController.getAll)
router.put('/contract-email', authMiddleware, ContractController.addContractEmail)
router.delete('/contract-email', authMiddleware, ContractController.deleteContractEmail)
router.get ('/byShopCode',authMiddleware, ContractController.getByShopCode)

module.exports = router