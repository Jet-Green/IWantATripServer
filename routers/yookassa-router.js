const Router = require('express').Router;
const yookassaController = require('../controllers/yookassa-controller');

const router = Router();

router.post('/webhook', yookassaController.webhook);

module.exports = router;
