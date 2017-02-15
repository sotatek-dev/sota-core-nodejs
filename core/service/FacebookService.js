var SocialNetworkService  = require('./SocialNetworkService');
var logger                = log4js.getLogger('FacebookService');

module.exports = SocialNetworkService.extends({
  classname : 'FacebookService',

  getUserSocialModel: function() {
    return this.getModel('UserFacebookModel');
  },

  getSocialConnectedProperty: function() {
    return 'isFacebookConnected';
  },

  getUserDefFromInfo: function(fbInfo) {
    var age = fbInfo.age_range ? (fbInfo.age_range.max || fbInfo.age_range.min) : 0;
    var birthYear = new Date().getFullYear() - age;

    return {
      username: fbInfo.id,
      email: fbInfo.email || fbInfo.id,
      full_name: fbInfo.first_name + ' ' + fbInfo.last_name,
      avatar_url: fbInfo.picture.data.url,
      birthday: birthYear + '0101',
      is_facebook_connected: 1,
    };
  },

  _getFacebookInfo: function(fbAcessToken, callback) {
    var secret = process.env.FACEBOOK_APP_SECRET;
    var hash = crypto.createHmac('sha256', secret).update(fbAcessToken);
    var appsecretProof = hash.digest('hex');
    var fields = 'id,name,email,first_name,last_name,gender,link,picture.type(large),age_range';

    request
      .get('https://graph.facebook.com/v2.8/me')
      .query({
        fields: fields,
        access_token: fbAcessToken,
        appsecret_proof: appsecretProof
      })
      .accept('json')
      .end(function(err, res) {
        if (err) {
          logger.error(err);
          return callback('FB authentication failed. err=' + util.inspect(err));
        }

        return callback(null, res.body);
      });
  },

  getUserByToken: function(fbAcessToken, callback) {
    var self = this;
    async.waterfall([
      function fbInfo(next) {
        self._getFacebookInfo(fbAcessToken, next);
      },
      function getUser(fbInfo, next) {
        fbInfo.access_token = fbAcessToken;
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
