var BaseError = require('./BaseError');

module.exports = BaseError.extends({
  classname: 'PayloadTooLargeError',

  initialize: function($super, msg, code) {
    this._httpStatus  = 413;
    this._code        = code || -1;
    this._msg         = msg || 'Payload Too Large';
  },

});
