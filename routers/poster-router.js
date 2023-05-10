const Router = require('express').Router

const posterController = require('../controllers/poster-controller')

const router = Router()

router.get('/get-all', posterController.getAll)

module.exports = router
