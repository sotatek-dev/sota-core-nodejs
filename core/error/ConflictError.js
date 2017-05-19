var BaseError = require('./BaseError');

class ConflictError extends BaseError {

  constructor (msg, extraInfo) {
    super();
    this._httpStatus = 409;
    this._msg = msg || 'Unkown conflict error.';
    this._extraInfo = extraInfo;
  }

}

module.exports = ConflictError;
