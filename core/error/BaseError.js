var Class = require('sota-class').Class;

class BaseError {

  getHttpStatus() {
    return this._httpStatus;
  }

  getCode() {
    return this._code;
  }

  getMsg() {
    return this._msg;
  }

  toJSON() {
    return {
      httpStatus: this._httpStatus,
      code: this._code,
      msg: this._msg,
    };
  }

};

module.exports = BaseError;
