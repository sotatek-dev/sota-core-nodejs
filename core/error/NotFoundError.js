var BaseError = require('./BaseError');

module.exports = BaseError.extends({
  classname: 'NotFoundError',

  initialize: function($super, msg, code) {
    this._httpStatus  = 404;
    this._code        = code || -1;
    this._msg         = msg || 'Bad request.';
  },

});
