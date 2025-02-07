const tasksController = require('../controllers/tasks-controller')
const authMiddleware = require('../middleware/auth-middleware')

const Router = require('express').Router

const router = Router()


router.post('/get-all', authMiddleware, tasksController.getAll)
router.post('/get-trip-tasks', authMiddleware, tasksController.getTripTasks)

router.post('/get-tasks-amount', authMiddleware, tasksController.getTasksAmount)

router.post('/create', authMiddleware, tasksController.create)
router.post('/delete', authMiddleware, tasksController.delete)
router.post('/edit', authMiddleware, tasksController.edit)
router.get('/get-by-id', authMiddleware, tasksController.getById)

router.post('/create-interaction', authMiddleware, tasksController.createInteraction)

router.post('/delete-manager', authMiddleware, tasksController.deleteManager)
router.post('/add-payment', authMiddleware, tasksController.addPayment)

router.post('/change-status', authMiddleware, tasksController.changeStatus)
router.post('/edit', authMiddleware, tasksController.edit)

module.exports = router