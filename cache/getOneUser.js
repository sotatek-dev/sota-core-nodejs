/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const _             = require('lodash');
const async         = require('async');
const util          = require('util');
const RedisCache    = require('./foundation/RedisCache');
const ExSession     = require('../common/ExSession');
const Const         = require('../common/Const');
const logger        = require('../index').getLogger('Cache.getOneUser');

module.exports = function (userId, callback) {
  var exSession = new ExSession();
  var UserModel = exSession.getModel('UserModel');
  var user = null;
  var key = 'user-' + userId;

  async.auto({
    cached: function (next) {
      RedisCache.getAsync(key, next);
    },

    user: ['cached', function (ret, next) {
      if (!_.isNil(ret.cached)) {
        user = JSON.parse(ret.cached);
        return next(null, user);
      }

      UserModel.findCacheOne(userId, next);
    }],

    recache: ['user', function (ret, next) {
      if (!_.isNil(ret.cached)) {
        return next(null, user);
      }

      if (_.isNil(ret.user)) {
        logger.warn(util.format('::getUser cannot find user: %s.', userId));
        return next(null, null);
      }

      user = ret.user.toJSON();
      var meta = {
        ttl: Const.MINUTE_IN_MILLISECONDS
      };

      RedisCache.setAsync(key, JSON.stringify(user), meta, next);
    }]
  }, function (err, ret) {
    exSession.destroy();

    if (err) {
      callback(err);
      return;
    }

    callback(null, user);
  });
};
