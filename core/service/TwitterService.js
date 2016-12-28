var SocialNetworkService = require('./SocialNetworkService');

module.exports = SocialNetworkService.extends({
  classname : 'TwitterService',

  getUserSocialModel: function() {
    return this.getModel('UserTwitterModel');
  },

  getUserDefFromInfo: function(twitterInfo) {
    var info = twitterInfo._json;
    return {
      username: twitterInfo.username,
      email: info.email || (info.screen_name + '@twitter.com'),
      first_name: info.name,
      last_name: '',
      avatar_url: info.profile_image_url,
    };
  },

});
