const Router = require('express').Router
const appStateController = require('../controllers/app-state-controller')


const router = Router()

router.get('/app-state', appStateController.getState)
router.post('/update', appStateController.update)
// router.get('/create-state', appStateController.createState)
router.get('/delete-mpm-by-id', appStateController.deleteMPMById)
router.get('/drop', appStateController.dropDatabase)
router.post('/add-trip-type', appStateController.addTripType)

module.exports = router