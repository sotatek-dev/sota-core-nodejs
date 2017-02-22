var ExSession = require('../../core/common/ExSession');
var logger    = log4js.getLogger('Cache.getOneUser');

module.exports = function(userId, callback) {
  var exSession = new ExSession();
  var UserModel = exSession.getModel('UserModel');
  var user = null;
  var key = 'user-' + userId;

  async.auto({
    cached: function(next) {
      RedisCache.get(key, next);
    },
    user: ['cached', function(ret, next) {
      if (!_.isNil(ret.cached)) {
        user = JSON.parse(ret.cached);
        return next(null, user);
      }

      UserModel.findCacheOne(userId, next);
    }],
    recache: ['user', function(ret, next) {
      if (!_.isNil(ret.cached)) {
        return next(null, user);
      }

      if (_.isNil(ret.user)) {
        logger.warn(util.format('::getUser cannot find user: %s.', userId));
        return next(null, null);
      }

      user = ret.user.toJSON();
      var meta = {
        ttl: Const.MINUTE_IN_MILLISECONDS,
      };

      RedisCache.set(key, JSON.stringify(user), meta, next);
    }],
  }, function(err, ret) {
    exSession.destroy();
    delete exSession;

    if (err) {
      callback(err);
      return;
    }

    callback(null, user);
  });

};
