var BaseError = require('./BaseError');

class UpgradeRequiredError extends BaseError {

  constructor (msg, extraInfo) {
    super();
    this._httpStatus = 426;
    this._msg = msg || 'Upgrade required';
    this._extraInfo = extraInfo;
  }

}

module.exports = UpgradeRequiredError;
