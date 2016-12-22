var ExSession = require('../common/ExSession');

module.exports = function(callback) {
  var key = 'dataVersion',
      exSession = new ExSession(),
      MasterModel = exSession.getModel('MasterModel');

  async.auto({
    cached: function(next) {
      RedisCache.get(key, next);
    },
    version: ['cached', function(ret, next) {
      // If cached value in redis cache is valid, just continue with it
      if (ret.cached && !isNaN(ret.cached)) {
        var version = parseInt(ret.cached);
        return next(null, version);
      }

      // Otherwise get it from DB
      MasterModel.getDataVersion(next);
    }],
    recache: ['version', function(ret, next) {
      // In any case, reset the local cache to make sure its value is up-to-date
      LocalCache.setSync(key, ret.version, {ttl: Const.YEAR_IN_MILLISECONDS});

      // Reset value in Redis if cached value is invalid or expired
      if (!ret.cached || isNaN(ret.cached)) {
        return RedisCache.set(key, ret.version, next);
      }

      // Otherwise, just continue
      return next(null, true);
    }],
  }, function(err, ret) {
    exSession.destroy();
    delete exSession;

    if (err) {
      callback(err);
      return;
    }

    callback(null, ret.version);
  });
};
