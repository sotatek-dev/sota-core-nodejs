var Twitter               = require('twitter');
var SocialNetworkService  = require('./SocialNetworkService');

module.exports = SocialNetworkService.extends({
  classname : 'TwitterService',

  getUserSocialModel: function() {
    return this.getModel('UserTwitterModel');
  },

  getUserDefFromInfo: function(twitterInfo) {
    var info = twitterInfo._json || twitterInfo;
    return {
      username: twitterInfo.screen_name,
      email: info.email || (info.screen_name + '@twitter.com'),
      full_name: info.name,
      avatar_url: info.profile_image_url,
    };
  },

  _getTwitterInfo: function(tokenKey, tokenSecret, callback) {
    var client = new Twitter({
      consumer_key: process.env.TWITTER_APP_ID,
      consumer_secret: process.env.TWITTER_APP_SECRET,
      access_token_key: tokenKey,
      access_token_secret: tokenSecret,
    });

    client.get('account/verify_credentials', function(err, twitterProfile, response) {
      if (err) {
        return callback(err);
      }

      return callback(null, twitterProfile);
    });
  },

  getUserByToken: function(tokenKey, tokenSecret, callback) {
    var self = this;
    async.waterfall([
      function twInfo(next) {
        self._getTwitterInfo(tokenKey, tokenSecret, next);
      },
      function getUser(twInfo, next) {
        twInfo.token = tokenKey;
        twInfo.token_secret = tokenSecret;
        return self.findOrCreateUserBySocialInfo(twInfo, next);
      },
    ], callback);
  },

  linkUserByToken: function(userId, tokenKey, tokenSecret, callback) {
    var self = this;
    async.waterfall([
      function twInfo(next) {
        self._getTwitterInfo(tokenKey, tokenSecret, next);
      },
      function getUser(twInfo, next) {
        return self.linkUserBySocialInfo(userId, twInfo, next);
      }
    ], callback);
  },

  getTwitterClient: function(tokenKey, tokenSecret) {
    return new Twitter({
      consumer_key: process.env.TWITTER_APP_ID,
      consumer_secret: process.env.TWITTER_APP_SECRET,
      access_token_key: tokenKey,
      access_token_secret: tokenSecret,
    });
  },

});
