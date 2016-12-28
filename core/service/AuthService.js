var jwt             = require('jsonwebtoken');
var crypto          = require('crypto');
var request         = require('request');

module.exports = BaseService.extends({
  classname: 'AuthService',

  generateAccessToken: function(user, expiredTime) {
    expiredTime = expiredTime || Const.DAY_IN_MILLISECONDS / 1000 * 30;

    return jwt.sign({
      userId: user.id
    }, process.env.SECRET, {
      expiresIn: expiredTime
    });
  },

  getUserFacebook: function(fbAcessToken, callback) {
    var self = this;
    var FacebookService = self.getService('FacebookService');

    async.waterfall([
      function fbInfo(next) {
        var secret = process.env.FACEBOOK_APP_SECRET;
        var hash = crypto.createHmac('sha256', secret).update(fbAcessToken);
        var appsecretProof = hash.digest('hex');
        var fields = 'id,name,email,first_name,last_name,gender,link,picture.type(large)';
        var url = util.format(
          'https://graph.facebook.com/v2.8/me?fields=%s&access_token=%s&appsecret_proof=%s',
          fields, fbAcessToken, appsecretProof
        );
        request({ json: true, url: url }, next);
      },
      function getUser(req, fbInfo, next) {
        if (fbInfo && fbInfo.id) {
          return FacebookService.findOrCreateUserBySocialInfo(fbInfo, next);
        }
        return next('FB authentication failed.');
      },
      function addToken(user, next) {
        if (!user) {
          return next('Cannot find or create user during authentication.');
        }
        var token = self.generateAccessToken(user);
        return next(null, {
          user: user,
          token: token
        });
      },
    ], callback);
  },

  getUserTwitter: function(twAcessToken, callback) {
    // TODO
  },

  getUserTwitter2: function(twitterProfile, callback) {
    var self = this;
    var TwitterService = this.getService('TwitterService');

    if (!twitterProfile) {
      return callback('Twitter authentication failed.');
    }

    async.waterfall([
      function getUser(next) {
        TwitterService.findOrCreateUserBySocialInfo(twitterProfile, next);
      },
      function addToken(user, next) {
        if (!user) {
          return next('Cannot find or create user during authentication.');
        }
        var token = self.generateAccessToken(user);
        return next(null, {
          user: user,
          token: token
        });
      }
    ], callback);
  },

});