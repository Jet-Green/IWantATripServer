const Router = require('express').Router

const AdminController = require('../controllers/admin-controller')

const router = Router()

router.get('/trips-on-moderation', AdminController.findForModeration)
router.get('/moderate-trip', AdminController.moderateTrip)

module.exports = router