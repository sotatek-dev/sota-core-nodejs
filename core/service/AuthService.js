var jwt             = require('jsonwebtoken');

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
      function user(next) {
        FacebookService.getUserByToken(fbAcessToken, next);
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

  linkUserFacebook: function(fbAcessToken, callback) {
    var FacebookService = self.getService('FacebookService');

    FacebookService.linkUserByToken(fbAcessToken, callback);
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