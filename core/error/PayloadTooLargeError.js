var BaseError = require('./BaseError');

class PayloadTooLargeError extends BaseError {

  constructor(msg, code) {
    super();
    this._httpStatus  = 413;
    this._code        = code || -1;
    this._msg         = msg || 'Payload Too Large';
  }

}

module.exports = PayloadTooLargeError;
