const Router = require('express').Router
const appStateController = require('../controllers/app-state-controller')
const adminMiddleware = require('../middleware/admin-middleware')



const router = Router()

router.get('/app-state', appStateController.getState)
router.post('/update',adminMiddleware, appStateController.update)
// router.get('/create-state', appStateController.createState)
// router.get('/delete-mpm-by-id', appStateController.deleteMPMById)
// router.get('/drop', appStateController.dropDatabase)
router.post('/set-trip-type',adminMiddleware, appStateController.setTripType)
router.post('/add-place-category',adminMiddleware, appStateController.addPlaceCategory )
router.post('/delete-trip-type', adminMiddleware, appStateController.deleteTripType)
router.post('/set-transport-name',adminMiddleware, appStateController.setTransportName)
router.post('/delete-transport-name',adminMiddleware, appStateController.deleteTransportName)
router.put('/excursion-types', adminMiddleware, appStateController.updateExcursionTypes)
router.patch('/excursion-types', adminMiddleware, appStateController.deleteExcursionType)
router.post('/trip-region',adminMiddleware, appStateController.addTripRegion)
router.post('/delete-trip-region',adminMiddleware, appStateController.deleteTripRegion)
router.post('/delete-place-category',adminMiddleware, appStateController.deletePlaceCategory)


module.exports = router