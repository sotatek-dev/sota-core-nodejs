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
      if (ret.cached && !isNaN(ret.cached)) {
        var version = parseInt(ret.cached);
        next(null, version);
        return;
      }

      MasterModel.getDataVersion(next);
    }],
    recache: ['version', function(ret, next) {
      if (ret.cached && !isNaN(ret.cached)) {
        return next(null, true);
      }

      LocalCache.setSync(key, ret.version, {ttl: Const.YEAR_IN_MILLISECONDS});
      RedisCache.set(key, ret.version, next);
    }],
  }, function(err, ret) {
    if (err) {
      callback(err);
      return;
    }

    callback(null, ret.version);
  });
};
