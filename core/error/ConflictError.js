var BaseError = require('./BaseError');

class ConflictError extends BaseError {

  constructor(msg, code) {
    super();
    this._httpStatus  = 409;
    this._code        = code || -1;
    this._msg         = msg || 'Unkown conflict error.';
  }

}

module.exports = ConflictError;
