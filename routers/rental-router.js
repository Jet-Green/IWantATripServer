const router = require('express').Router();
const service = require('../service/rental-catalog-service').createCatalogService();
const handle = method => async (req, res) => {
    try { res.json(await method(req)); }
    catch (error) { res.status(error.status || 502).json({ message: error.status ? error.message : 'Каталог аренды временно недоступен' }); }
};
router.get('/listings', handle(req => service.list(req.query)));
router.get('/listings/:id', handle(req => service.detail(req.params.id)));
router.get('/categories', handle(() => service.categories()));
module.exports = router;
