var BaseError = require('./BaseError');

class ServiceUnavailableError extends BaseError {

  constructor (msg, extraInfo) {
    super();
    this._httpStatus = 503;
    this._msg = msg || 'Service unavailable.';
    this._extraInfo = extraInfo;
  }

}

module.exports = ServiceUnavailableError;
