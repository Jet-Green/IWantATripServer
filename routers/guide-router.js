// here all imports
const Router = require('express').Router

// here all controllers
const guideController = require('../controllers/guide-controller')


const router = Router()


// here all routes
router.get('/get-all-elements', guideController.getAllElements)




module.exports = router