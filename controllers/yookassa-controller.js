const YooKassaService = require('../service/yookassa-service');

module.exports = {
  async webhook(req, res) {
    const result = YooKassaService.handleNotification(req.body, req.ip);
    return res.sendStatus(result.httpStatus);
  },
};
