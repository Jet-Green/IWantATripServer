const Router = require('express').Router

const AdminController = require('../controllers/admin-controller')

const router = Router()

router.get('/trips-on-moderation', AdminController.findForModeration)
router.get('/moderate-trip', AdminController.moderateTrip)
router.post('/send-moderation-message', AdminController.sendModerationMessage)
router.get('/rejected-trips', AdminController.findRejectedTrips)

router.post('/get-users', AdminController.fetchUsers)
router.post('/change-user-roles', AdminController.changeUserRoles)

router.post('/add-email', AdminController.addEmail)
router.get('/get-emails', AdminController.getEmails)
router.get('/delete-email', AdminController.deleteEmail)

router.post('/add-cabinet-notifications', AdminController.addCabinetNotifications)
router.post('/get-notifications', AdminController.getNotifications)
router.post('/delete-notifications', AdminController.deleteNotifications)

module.exports = router