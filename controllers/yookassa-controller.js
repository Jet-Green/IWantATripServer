const YooKassaService = require('../service/yookassa-service');

module.exports = {
  async webhook(req, res) {
    console.log('[yookassa webhook] body:', JSON.stringify(req.body, null, 2));
    const result = YooKassaService.handleNotification(req.body, req.ip);
    return res.sendStatus(result.httpStatus);
  },
};
