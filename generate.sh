touch "./routers/$1-router.js"
echo -e "const Router = require('express').Router\n\nconst $1Controller = require('../controllers/$1-controller')\nconst router = Router()\n\nrouter.get('/', $1Controller.)\n\nmodule.exports = router" >> ./routers/$1-router.js

touch "./controllers/$1-controller.js"
echo -e "module.exports = {\n   async func () {\n\n   }\n}" >> ./controllers/$1-controller.js

touch "./service/$1-service.js" 
echo -e "module.exports = {\n   async func () {\n\n   }\n}" >> ./service/$1-service.js