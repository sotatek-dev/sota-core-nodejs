var BaseController  = require('./BaseController');
var passport        = require('passport');
var jwt             = require('jsonwebtoken');
var crypto          = require('crypto');
var request         = require('request');

module.exports = BaseController.extends({
  classname: 'AuthController',

  generateAccessToken: function(user, expiredTime) {
    expiredTime = expiredTime || Const.DAY_IN_MILLISECONDS / 1000 * 30;

    return jwt.sign({
      userId: user.id
    }, process.env.SECRET, {
      expiresIn: expiredTime
    });
  },

  login: function(req, res) {
    var self = this,
        redirectUrl = '/';

    if (req.allParams && req.allParams['redirect_url']) {
      redirectUrl = req.allParams['redirect_url'];
    }

    passport.authenticate('local', {
      successRedirect   : redirectUrl,
      failureRedirect   : '/login',
      failureFlash      : true,
    }, function(err, user, info) {
      logger.trace('login err=' + util.inspect(err));
      logger.trace('login user=' + util.inspect(user));
      logger.trace('login info=' + util.inspect(info));

      if (err) {
        return res.sendError(err);
      }

      if (user === false) {
        if (info && info.message) {
          return res.sendError(info.message);
        }

        return res.sendError(info);
      }

      var token = self.generateAccessToken(user);

      res.ok(user.setExtra({
        token: token
      }));

    })(req, res);
  },

  logout: function(req, res) {
    // TODO: invalidate the old auth token.
    res.ok();
  },

  facebook: function(req, res) {
    var self = this;
    var [err, params] = new Checkit({
      fb_access_token: ['required', 'string'],
    }).validateSync(req.allParams);

    if (err) {
      return res.badRequest(err.toString());
    }

    var AuthService = req.getService('AuthService');
    AuthService.getUserFacebook(params.fb_access_token, this.ok.bind(this, req, res));
  },

  twitter2: function(req, res, next) {
    passport.authenticate('twitter')(req, res, next);
  },

  twitter2CB: function(req, res) {
    var self = this;
    var AuthService = req.getService('AuthService');

    passport.authenticate('twitter', {
      failureRedirect: '/login'
    }, function(err, data, info) {
      if (err) {
        return res.sendError(err);
      }

      if (data === false) {
        if (info && info.message) {
          return res.sendError(info.message);
        }

        return res.sendError(info);
      }

      AuthService.getUserTwitter2(data.profile, self.ok.bind(self, req, res));
    })(req, res);
  },

});
