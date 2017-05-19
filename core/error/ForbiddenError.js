var BaseError = require('./BaseError');

class ForbiddenError extends BaseError {

  constructor (msg, extraInfo) {
    super();
    this._httpStatus = 403;
    this._msg = msg || 'Forbidden.';
    this._extraInfo = extraInfo;
  }

}

module.exports = ForbiddenError;
