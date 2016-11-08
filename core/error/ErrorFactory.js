var BadRequestError   = require('./BadRequestError');
var UnauthorizedError = require('./UnauthorizedError');
var NotFoundError     = require('./NotFoundError');
var ConflictError     = require('./ConflictError');
var ForbiddenError    = require('./ForbiddenError');
var InternalError     = require('./InternalError');

module.exports = Class.singleton({
  classname: 'ErrorFactory',

  badRequest: function(msg, code) {
    return new BadRequestError(msg, code);
  },

  unauthorized: function(msg, code) {
    return new UnauthorizedError(msg, code);
  },

  forbidden: function(msg, code) {
    return new ForbiddenError(msg, code);
  },

  notFound: function(msg, code) {
    return new NotFoundError(msg, code);
  },

  conflict: function(msg, code) {
    return new ConflictError(msg, code);
  },

  internal: function(msg, code) {
    return new InternalError(msg, code);
  },

});
