var BaseError = require('./BaseError');

class ForbiddenError extends BaseError {

  constructor(msg, code) {
    super();
    this._httpStatus  = 403;
    this._code        = code || -1;
    this._msg         = msg || 'Forbidden.';
  }

}

module.exports = ForbiddenError;
