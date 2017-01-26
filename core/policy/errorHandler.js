// Final error handler if one of policies is not validated
var logger    = log4js.getLogger('PolicyErrorHandler');
var BaseError = require('../error/BaseError');

module.exports = function(err, req, res) {
  if (err instanceof BaseError) {
    res.sendError(err);
    return;
  }

  var status = 500;
  if (err.status > 0) {
    status = err.status;
  }

  var msg = 'Unknown Internal Server Error';
  if ('string' === typeof err) {
    msg = err;
  } else if (err.msg && 'string' === typeof err.msg) {
    msg = err.msg;
  }

  logger.error('I don\'t know what happened but something went wrong!');
  logger.error('You should never see this message...');
  logger.error(msg);

  res.status(status).send(msg);
};
