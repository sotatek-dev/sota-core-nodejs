var BaseError = require('./BaseError');

module.exports = BaseError.extends({
  classname: 'BadRequestError',

  initialize: function($super, msg, code) {
    this._httpStatus  = 400;
    this._code        = code || -1;
    this._msg         = msg || 'Bad request.';
  },

});
