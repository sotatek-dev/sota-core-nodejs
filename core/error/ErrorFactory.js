/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var BadRequestError           = require('./BadRequestError')
var UnauthorizedError         = require('./UnauthorizedError')
var NotFoundError             = require('./NotFoundError')
var ConflictError             = require('./ConflictError')
var ForbiddenError            = require('./ForbiddenError')
var InternalError             = require('./InternalError')
var TooLargeError             = require('./PayloadTooLargeError')
var UpgradeRequiredError      = require('./UpgradeRequiredError')
var ServiceUnavailableError   = require('./ServiceUnavailableError')
var Class                     = require('sota-class').Class

module.exports = Class.singleton({
  classname: 'ErrorFactory',

  badRequest: function (msg, extraInfo) {
    return new BadRequestError(msg, extraInfo)
  },

  unauthorized: function (msg, extraInfo) {
    return new UnauthorizedError(msg, extraInfo)
  },

  forbidden: function (msg, extraInfo) {
    return new ForbiddenError(msg, extraInfo)
  },

  notFound: function (msg, extraInfo) {
    return new NotFoundError(msg, extraInfo)
  },

  conflict: function (msg, extraInfo) {
    return new ConflictError(msg, extraInfo)
  },

  payloadTooLarge: function (msg, extraInfo) {
    return new TooLargeError(msg, extraInfo)
  },

  internal: function (msg, extraInfo) {
    return new InternalError(msg, extraInfo)
  },

  upgradeRequired: function (msg, extraInfo) {
    return new UpgradeRequiredError(msg, extraInfo)
  },

  unavailable: function (msg, extraInfo) {
    return new ServiceUnavailableError(msg, extraInfo)
  }

})
