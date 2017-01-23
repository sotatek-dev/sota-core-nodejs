var crypto                = require('crypto');
var request               = require('request');
var SocialNetworkService  = require('./SocialNetworkService');

module.exports = SocialNetworkService.extends({
  classname : 'FacebookService',

  getUserSocialModel: function() {
    return this.getModel('UserFacebookModel');
  },

  getUserDefFromInfo: function(fbInfo) {
    return {
      username: fbInfo.id,
      email: fbInfo.email || fbInfo.id,
      full_name: fbInfo.first_name + ' ' + fbInfo.last_name,
      avatar_url: fbInfo.picture.data.url,
    };
  },

  _getFacebookInfo: function(fbAcessToken, callback) {
    var secret = process.env.FACEBOOK_APP_SECRET;
    var hash = crypto.createHmac('sha256', secret).update(fbAcessToken);
    var appsecretProof = hash.digest('hex');
    var fields = 'id,name,email,first_name,last_name,gender,link,picture.type(large)';
    var url = util.format(
      'https://graph.facebook.com/v2.8/me?fields=%s&access_token=%s&appsecret_proof=%s',
      fields, fbAcessToken, appsecretProof
    );
    var requestDef = {
      json: true, url: url
    };

    request(requestDef, function(err, req, fbInfo) {
      logger.trace('_getFacebookInfo fbInfo=' + util.inspect(fbInfo));
      if (!fbInfo || !fbInfo.id) {
        return callback('FB authentication failed.');
      }

      return callback(null, fbInfo);
    });
  },

  getUserByToken: function(fbAcessToken, callback) {
    var self = this;
    async.waterfall([
      function fbInfo(next) {
        self._getFacebookInfo(fbAcessToken, next);
      },
      function getUser(fbInfo, next) {
        return self.findOrCreateUserBySocialInfo(fbInfo, next);
      },
    ], callback);
  },

  linkUserByToken: function(userId, fbAcessToken, callback) {
    var self = this;
    async.waterfall([
      function fbInfo(next) {
        self._getFacebookInfo(fbAcessToken, next);
      },
      function tryToLinkUser(fbInfo, next) {
        return self.linkUserBySocialInfo(userId, fbInfo, next);
      }
    ], callback);
  },

});
