var Class = require('sota-class').Class;

class BaseError {

  getHttpStatus() {
    return this._httpStatus;
  }

  getMsg() {
    return this._msg;
  }

  getExtraInfo() {
    return this._extraInfo;
  }

  setExtraInfo(extraInfo) {
    var originInfo = this._extraInfo || {};
    this._extraInfo = _.assign(originInfo, extraInfo);
    return this;
  }

  toJSON() {
    return {
      httpStatus  : this._httpStatus,
      msg         : this._msg,
      extraInfo   : this._extraInfo || null,
    };
  }

};

module.exports = BaseError;
