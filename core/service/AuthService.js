/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var async         = require('async')
var jwt           = require('jsonwebtoken')
var BaseService   = require('./BaseService')

module.exports = BaseService.extends({
  classname: 'AuthService',

  generateAccessToken: function (user, expiredTime) {
    expiredTime = expiredTime || Const.DAY_IN_MILLISECONDS / 1000 * 30

    return jwt.sign({
      userId: user.id
    }, process.env.SECRET, {
      expiresIn: expiredTime
    })
  },

  _signTokenAndReturn: function (user, callback) {
    var self = this
    if (!user) {
      return callback('Cannot find or create user during authentication.')
    }

    var token = self.generateAccessToken(user)
    return callback(null, {
      user: user,
      token: token
    })
  },

  getUserFacebook: function (fbAcessToken, callback) {
    var self = this
    var FacebookService = self.getService('FacebookService')

    async.waterfall([
      function user (next) {
        FacebookService.getUserByToken(fbAcessToken, next)
      },
      function addToken (user, next) {
        self._signTokenAndReturn(user, next)
      }
    ], callback)
  },

  getUserTwitter: function (tokenKey, tokenSecret, callback) {
    var self = this
    var TwitterService = self.getService('TwitterService')

    async.waterfall([
      function user (next) {
        TwitterService.getUserByToken(tokenKey, tokenSecret, next)
      },
      function addToken (user, next) {
        self._signTokenAndReturn(user, next)
      }
    ], callback)
  },

  getUserGoogle: function (params, callback) {
    var self = this
    var GoogleService = self.getService('GoogleService')

    async.waterfall([
      function user (next) {
        GoogleService.getUserByToken(params, next)
      },
      function addToken (user, next) {
        self._signTokenAndReturn(user, next)
      }
    ], callback)
  },

  getUserTwitter2: function (twitterProfile, callback) {
    var self = this
    var TwitterService = this.getService('TwitterService')

    if (!twitterProfile) {
      return callback('Twitter authentication failed.')
    }

    async.waterfall([
      function getUser (next) {
        TwitterService.findOrCreateUserBySocialInfo(twitterProfile, next)
      },
      function addToken (user, next) {
        if (!user) {
          return next('Cannot find or create user during authentication.')
        }
        var token = self.generateAccessToken(user)
        return next(null, {
          user: user,
          token: token
        })
      }
    ], callback)
  }

})
