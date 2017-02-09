var BaseError = require('./BaseError');

class NotFoundError extends BaseError {

  constructor(msg, extraInfo) {
    super();
    this._httpStatus  = 404;
    this._msg         = msg || 'Not found.';
    this._extraInfo   = extraInfo;
  }

}

module.exports = NotFoundError;
