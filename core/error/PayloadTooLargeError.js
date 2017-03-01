var BaseError = require('./BaseError')

class PayloadTooLargeError extends BaseError {

  constructor (msg, extraInfo) {
    super()
    this._httpStatus = 413
    this._msg = msg || 'Payload Too Large'
    this._extraInfo = extraInfo
  }

}

module.exports = PayloadTooLargeError
