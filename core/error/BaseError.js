var BaseClass = require('../common/BaseClass');

var BaseError = BaseClass.extend({
  classname : 'BaseError',

  $_TYPE : 'UNKOWN',

  initialize : function(msg, code) {
    var base = Const.ERROR_TYPE[this._TYPE];
    this._httpStatus  = base.STATUS;
    this._code        = base.CODE;
    this._msg         = base.MSG;

    if (msg && typeof msg === 'string') {
      this._msg = msg;
    }

    if (typeof code === 'number') {
      this._code = code;
    }
  },

  getHttpStatus : function() {
    return this._httpStatus;
  },

  getCode : function() {
    return this._code;
  },

  getMsg : function() {
    return this._msg;
  },

});

module.exports = BaseError;
