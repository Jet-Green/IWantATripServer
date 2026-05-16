const photosController = require('../controllers/photos-controller')
const authMiddleware = require('../middleware/auth-middleware')
const managerMiddleware = require('../middleware/manager-middleware')

const Router = require('express').Router

const router = Router()

const MULTER = require('multer')

router.get('/get-photos', photosController.getPhotos)

router.get('/search', photosController.searchPhotobank)

router.post('/filter-published', authMiddleware, photosController.filterPublishedUrls)

router.post('/upload-photobank', MULTER().any(), authMiddleware, photosController.uploadPhotobank)

router.get('/my-photos', authMiddleware, photosController.findMyPhotos)
router.post('/update-my-photo', authMiddleware, photosController.updateMyPhoto)
router.patch('/my-photo', authMiddleware, photosController.updateMyPhoto)
router.delete('/my-photo', authMiddleware, photosController.deleteMyPhoto)

router.get('/on-moderation', managerMiddleware, photosController.findPhotosOnModeration)
router.get('/rejected', managerMiddleware, photosController.findRejectedPhotos)
router.get('/by-id', managerMiddleware, photosController.getPhotoById)
router.get('/moderate', managerMiddleware, photosController.moderatePhoto)
router.post('/reject', managerMiddleware, photosController.rejectPhoto)
router.delete('/delete', managerMiddleware, photosController.deletePhoto)

module.exports = router