var BaseError = require('./BaseError');

class BadRequestError extends BaseError {

  constructor(msg, code) {
    super();
    this._httpStatus  = 400;
    this._code        = code || -1;
    this._msg         = msg || 'Bad request.';
  }

}

module.exports = BadRequestError;