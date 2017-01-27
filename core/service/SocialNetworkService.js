module.exports = BaseService.extends({
  classname : 'SocialNetworkService',

  getUserSocialModel: function() {
    throw new Error('Must be implemented in derived class.');
  },

  getUserDefFromInfo: function() {
    throw new Error('Must be implemented in derived class.');
  },

  getSocialIdFromInfo: function(info) {
    return info.id;
  },

  findOrCreateUserBySocialInfo: function(info, callback) {
    var self = this;
    var UserSocialModel = self.getUserSocialModel();
    var UserModel = self.getModel('UserModel');
    var UserService = self.getService('UserService');
    var userDef = self.getUserDefFromInfo(info);
    var socialId = self.getSocialIdFromInfo(info);

    async.auto({
      userSocial: function(next) {
        UserSocialModel.findOne({
          where: 'social_id=?',
          params: [socialId],
        }, next);
      },
      user: ['userSocial', function(ret, next) {
        if (ret.userSocial) {
          return UserModel.findCacheOne(ret.userSocial.id, next);
        }

        UserService.register(userDef, next);
      }],
      newUserSocial: ['user', function(ret, next) {
        if (ret.userSocial) {
          return next(null, ret.userSocial);
        }

        var options = {
          isForceNew: true,
        };

        UserSocialModel.add({
          id: ret.user.id,
          social_id: socialId,
        }, options, next);
      }],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }

      callback(null, ret.user);
    });
  },

  linkUserBySocialInfo: function(userId, info, callback) {
    var self = this;
    var UserSocialModel = self.getUserSocialModel();
    var UserModel = self.getModel('UserModel');
    var socialId = self.getSocialIdFromInfo(info);
    var result = null;

    async.waterfall([
      function userSocialExisted(next) {
        UserSocialModel.findOne({
          where: 'social_id=?',
          params: [socialId],
        }, next);
      },
      function user(userSocial, next) {
        if (userSocial) {
          return next(ErrorFactory.conflict('Already linked to another account.'));
        }

        UserModel.findCacheOne(userId, next);
      },
      function newUserSocial(user, next) {
        if (!user) {
          return next(ErrorFactory.notFound('Cannot find target user.'));
        }

        result = user;
        var options = {
          isForceNew: true,
        };

        UserSocialModel.add({
          id: userId,
          social_id: socialId,
        }, options, next);
      },
    ], function(err, ret) {
      if (err) {
        return callback(err);
      }
       return callback(null, result);
    });
  },

  unlink: function(userId, callback) {
    var self = this;
    var UserSocialModel = self.getUserSocialModel();

    async.waterfall([
      function count(next) {
        self.countConnectedServices(userId, next);
      },
      function action(count, next) {
        if (!count || count <= 1) {
          return next(ErrorFactory.badRequest('Cannot unlink the only left connected service.'));
        }

        UserSocialModel.remove(userId, next);
      }
    ], callback);
  },

  countConnectedServices: function(userId, callback) {
    var self = this;
    var UserFacebookModel = self.getModel('UserFacebookModel');
    var UserTwitterModel = self.getModel('UserTwitterModel');
    var UserGoogleModel = self.getModel('UserGoogleModel');

    async.auto({
      userFacebook: function(next) {
        UserFacebookModel.findById(userId, next);
      },
      userTwitter: function(next) {
        UserTwitterModel.findById(userId, next);
      },
      userGoogle: function(next) {
        UserGoogleModel.findById(userId, next);
      }
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }

      var count = 0;
      if (ret.userFacebook) {
        count++;
      }

      if (ret.userTwitter) {
        count++;
      }

      if (ret.userGoogle) {
        count++;
      }

      callback(null, count);
    });
  }

});
