var BaseError = require('./BaseError')

class UnauthorizedError extends BaseError {

  constructor (msg, extraInfo) {
    super()
    this._httpStatus = 401
    this._msg = msg || 'Bad request.'
    this._extraInfo = extraInfo
  }

}

module.exports = UnauthorizedError
