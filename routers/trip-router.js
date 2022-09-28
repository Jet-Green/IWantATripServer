// here all imports
const Router = require('express').Router

// here all controllers
const tripController = require('../controllers/trip-controller')


const router = Router()


// here all routes
router.get('/get-all', tripController.getAll)
router.get('/get-by-id', tripController.getById)



module.exports = router