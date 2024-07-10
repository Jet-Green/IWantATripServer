const photosController = require('../controllers/photos-controller')

const Router = require('express').Router

const router = Router()

router.get('/get-photos',  photosController.getPhotos)

module.exports = router