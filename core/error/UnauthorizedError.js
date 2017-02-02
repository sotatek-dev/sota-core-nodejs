var BaseError = require('./BaseError');

class UnauthorizedError extends BaseError {

  constructor(msg, code) {
    super();
    this._httpStatus  = 401;
    this._code        = code || -1;
    this._msg         = msg || 'Bad request.';
  }

}

module.exports = UnauthorizedError;
