var BaseError = require('./BaseError')

class InternalError extends BaseError {

  constructor (msg, extraInfo) {
    super()
    this._httpStatus = 500
    this._msg = msg || 'Internal Server Error.'
    this._extraInfo = extraInfo
  }

}

module.exports = InternalError
