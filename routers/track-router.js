const Router = require('express');
const router = new Router();
const trackController = require('../controllers/track-controller');
const authMiddleware = require('../middleware/auth-middleware');

router.post('/create', authMiddleware, trackController.create);
router.post('/delete', authMiddleware, trackController.delete);
router.post('/get-all', trackController.getAll);
router.get('/get-by-id', trackController.getById);
router.post('/edit', authMiddleware, trackController.edit);

module.exports = router;
