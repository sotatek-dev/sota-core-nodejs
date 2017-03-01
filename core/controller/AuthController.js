/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var util              = require('util')
var BaseController    = require('./BaseController')
var passport          = require('passport')
var jwt               = require('jsonwebtoken')
var logger            = log4js.getLogger('AuthController')

module.exports = BaseController.extends({
  classname: 'AuthController',

  generateAccessToken: function (user, expiredTime) {
    expiredTime = expiredTime || Const.DAY_IN_MILLISECONDS / 1000 * 30

    return jwt.sign({
      userId: user.id
    }, process.env.SECRET, {
      expiresIn: expiredTime
    })
  },

  login: function (req, res) {
    var self = this
    var redirectUrl = '/'

    if (req.allParams && req.allParams['redirect_url']) {
      redirectUrl = req.allParams['redirect_url']
    }

    passport.authenticate('local', {
      successRedirect: redirectUrl,
      failureRedirect: '/login',
      failureFlash: true
    }, function (err, user, info) {
      logger.trace('login err=' + util.inspect(err))
      logger.trace('login user=' + util.inspect(user))
      logger.trace('login info=' + util.inspect(info))

      if (err) {
        return res.sendError(err)
      }

      if (user === false) {
        if (info && info.message) {
          return res.sendError(info.message)
        }

        return res.sendError(info)
      }

      var token = self.generateAccessToken(user)

      res.ok(user.setExtra({
        token: token
      }))
    })(req, res)
  },

  logout: function (req, res) {
    // TODO: invalidate the old auth token.
    res.ok()
  }

})
