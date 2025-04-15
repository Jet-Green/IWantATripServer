const Router = require('express').Router
const authMiddleware = require('../middleware/auth-middleware')
const adminMiddleware = require('../middleware/admin-middleware')
const ContractController = require('../controllers/contract-controller')


const router = Router()
router.get('/', authMiddleware, ContractController.getContractById)
router.post('/delete', adminMiddleware, ContractController.deleteContract)
router.post('/register', adminMiddleware, ContractController.registerContract)
router.post('/create', authMiddleware, ContractController.createContract)
router.post('/get-all', adminMiddleware, ContractController.getAll)
router.put('/contract-email', adminMiddleware, ContractController.addContractEmail)
router.delete('/contract-email', adminMiddleware, ContractController.deleteContractEmail)
router.get ('/byShopCode',authMiddleware, ContractController.getByShopCode)

module.exports = router