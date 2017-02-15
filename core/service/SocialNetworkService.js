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
          access_token: info.access_token,
          refresh_token: info.refresh_token,
          token: info.token,
          token_secret: info.token_secret,
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
    var socialConnectedProperty = self.getSocialConnectedProperty();
    var result = null;

    async.waterfall([
      function userSocialExisted(next) {
        UserSocialModel.findOne({
          where: 'social_id=?',
          params: [socialId],
        }, function(err, ret) {
          if (err) {
            return next(err);
          }

          if (ret) {
            return next(ErrorFactory.conflict('The sns account is already linked to other user.'));
          }

          next();
        });
      },
      function userAlreadyConnected(next) {
        UserSocialModel.findById(userId, function(err, ret) {
          if (err) {
            return next(err);
          }

          if (ret) {
            return next(ErrorFactory.conflict('User is already connected to other sns account'));
          }

          next();
        });
      },
      function user(next) {
        UserModel.findCacheOne(userId, next);
      },
      function updateUser(user, next) {
        user.setFieldValue(socialConnectedProperty, 1);
        user.save(next);
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
          access_token: info.access_token,
          refresh_token: info.refresh_token,
          token: info.token,
          token_secret: info.token_secret,
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
    var socialConnectedProperty = self.getSocialConnectedProperty();
    var UserModel = self.getModel('UserModel');

    async.waterfall([
      function user(next) {
        UserModel.findCacheOne(userId, next);
      },
      function updateUser(user, next) {
        user.setFieldValue(socialConnectedProperty, 0);
        user.save(next);
      },
      function action(user, next) {
        var count = _.compact(_.values(_.pick(user.toJSON(),
          ['isFacebookConnected', 'isGoogleConnected', 'isTwitterConnected']
        ))).length;

        if (!count || count < 1) {
          return next(ErrorFactory.forbidden('Cannot unlink the only left connected service.'));
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
  },

});
