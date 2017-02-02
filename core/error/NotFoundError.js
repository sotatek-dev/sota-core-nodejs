var BaseError = require('./BaseError');

class NotFoundError extends BaseError {

  constructor(msg, code) {
    super();
    this._httpStatus  = 404;
    this._code        = code || -1;
    this._msg         = msg || 'Bad request.';
  }

}

module.exports = NotFoundError;
