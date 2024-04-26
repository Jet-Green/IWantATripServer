const ideaController = require('../controllers/idea-controller')
const authMiddleware = require('../middleware/auth-middleware')
const Router = require('express').Router

const router = Router()

router.post('/create-idea', authMiddleware, ideaController.createIdea)

module.exports = router