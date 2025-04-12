const Router = require('express').Router
const adminMiddleware = require('../middleware/admin-middleware')
const managerMiddleware = require('../middleware/manager-middleware')
const AdminController = require('../controllers/admin-controller')

const router = Router()

router.get('/trips-on-moderation',managerMiddleware, AdminController.findForModeration)
router.get('/moderate-trip',managerMiddleware, AdminController.moderateTrip)
router.get('/moderate-catalog-trip',managerMiddleware, AdminController.moderateCatalogTrip)
router.post('/send-moderation-message',managerMiddleware, AdminController.sendModerationMessage)
router.post('/send-catalog-moderation-message',managerMiddleware, AdminController.sendCatalogModerationMessage)
router.get('/rejected-trips',managerMiddleware, AdminController.findRejectedTrips)

router.get('/rejected-catalog-trips',managerMiddleware, AdminController.findRejectedCatalogTrips)
router.get('/catalog-trips-on-moderation',managerMiddleware, AdminController.findCatalogTripsOnModeration)


router.post('/get-users',adminMiddleware, AdminController.fetchUsers)
router.post('/change-user-roles',adminMiddleware, AdminController.changeUserRoles)

router.post('/add-email',adminMiddleware, AdminController.addEmail)
router.get('/get-emails',adminMiddleware, AdminController.getEmails)
router.get('/delete-email',adminMiddleware, AdminController.deleteEmail)

router.post('/add-cabinet-notifications',adminMiddleware, AdminController.addCabinetNotifications)
router.post('/get-notifications',adminMiddleware, AdminController.getNotifications)
router.post('/delete-notifications',adminMiddleware, AdminController.deleteNotifications)

module.exports = router