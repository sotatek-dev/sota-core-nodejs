var BaseError = require('./BaseError');

module.exports = BaseError.extends({
  classname: 'InternalError',

  initialize: function($super, msg, code) {
    this._httpStatus  = 500;
    this._code        = code || -1;
    this._msg         = msg || 'Internal Server Error.';
  },

});
