var SocialNetworkService = require('./SocialNetworkService');

module.exports = SocialNetworkService.extends({
  classname : 'FacebookService',

  getUserSocialModel: function() {
    return this.getModel('UserFacebookModel');
  },

  getUserDefFromInfo: function(fbInfo) {
    return {
      username: fbInfo.id,
      email: fbInfo.email || fbInfo.id,
      first_name: fbInfo.first_name,
      last_name: fbInfo.last_name,
      avatar_url: fbInfo.picture.data.url,
    };
  },

});
