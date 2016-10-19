var BadRequestError   = require('./BadRequestError');
var UnauthorizedError = require('./UnauthorizedError');
var NotFoundError     = require('./NotFoundError');
var ConflictError     = require('./ConflictError');
var ForbiddenError    = require('./ForbiddenError');

module.exports = BaseClass.singleton({
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

});
