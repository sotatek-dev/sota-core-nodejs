var BaseError = require('./BaseError')

class BadRequestError extends BaseError {

  constructor (msg, extraInfo) {
    super()
    this._httpStatus = 400
    this._msg = msg || 'Bad request.'
    this._extraInfo = extraInfo
  }

}

module.exports = BadRequestError
