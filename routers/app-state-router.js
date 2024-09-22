const Router = require('express').Router
const appStateController = require('../controllers/app-state-controller')


const router = Router()

router.get('/app-state', appStateController.getState)
router.post('/update', appStateController.update)
// router.get('/create-state', appStateController.createState)
router.get('/delete-mpm-by-id', appStateController.deleteMPMById)
// router.get('/drop', appStateController.dropDatabase)
router.post('/set-trip-type', appStateController.setTripType)
router.post('/delete-trip-type', appStateController.deleteTripType)
router.post('/set-transport-name', appStateController.setTransportName)
router.post('/delete-transport-name', appStateController.deleteTransportName)
router.put('/excursion-types', appStateController.updateExcursionTypes)
router.patch('/excursion-types', appStateController.deleteExcursionType)
router.post('/trip-region', appStateController.addTripRegion)
router.post('/delete-trip-region', appStateController.deleteTripRegion)

module.exports = router