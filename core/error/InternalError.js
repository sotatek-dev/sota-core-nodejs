var BaseError = require('./BaseError');

class InternalError extends BaseError {

  constructor(msg, code) {
    super();
    this._httpStatus  = 500;
    this._code        = code || -1;
    this._msg         = msg || 'Internal Server Error.';
  }

}

module.exports = InternalError;