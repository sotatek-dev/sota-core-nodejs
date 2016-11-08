var BaseError = require('./BaseError');

module.exports = BaseError.extends({
  classname: 'UnauthorizedError',

  initialize: function($super, msg, code) {
    this._httpStatus  = 401;
    this._code        = code || -1;
    this._msg         = msg || 'Bad request.';
  },

});
