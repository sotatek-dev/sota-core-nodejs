var BaseError = require('./BaseError');

module.exports = BaseError.extends({
  classname: 'ConflictError',

  initialize: function($super, msg, code) {
    this._httpStatus  = 409;
    this._code        = code || -1;
    this._msg         = msg || 'Unkown conflict error.';
  },

});
