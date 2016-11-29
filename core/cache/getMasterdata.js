var ExSession = require('../../core/common/ExSession');

function requery(version, callback) {
  if (typeof version !== 'number') {
    throw new Error('Cannot get invalid masterdata version: ' + version);
  }

  var exSession = new ExSession(),
      LevelModel = exSession.getModel('LevelModel'),
      ItemModel = exSession.getModel('ItemModel'),
      TrophyModel = exSession.getModel('TrophyModel'),
      SubscriptionModel = exSession.getModel('SubscriptionModel'),
      BanReasonModel = exSession.getModel('BanReasonModel');

  async.auto({
    version: function(next) {
      next(null, version);
    },
    levels: ['version', function(ret, next) {
      LevelModel.getByVersion(version, next);
    }],
    items: ['version', function(ret, next) {
      ItemModel.getByVersion(version, next);
    }],
    trophys: ['version', function(ret, next) {
      TrophyModel.getByVersion(version, next);
    }],
    subscriptions: ['version', function(ret, next) {
      SubscriptionModel.getByVersion(version, next);
    }],
    banReasons: ['version', function(ret, next) {
      BanReasonModel.getByVersion(version, next);
    }],
    configs: function(next) {
      var result = {
        streamingServerUrl: process.env.STREAMING_SERVER_ADDRESS,
        streamingServerUsername: process.env.STREAMING_SERVER_USERNAME,
        streamingServerPassword: process.env.STREAMING_SERVER_PASSWORD,
        streamingAppName: process.env.STREAMING_APP_NAME
      };
      next(null, result);
    }
  }, function(err, ret) {
    exSession.destroy();
    delete exSession;

    if (err) {
      return callback(err);
    }

    callback(null, ret);
  });
}

function getVersion(cache, callback) {
  var exSession = new ExSession(),
      key = 'dataVersion',
      MasterModel = exSession.getModel('MasterModel');

  async.auto({
    cached: function(next) {
      cache.get(key, next);
    },
    version: ['cached', function(ret, next) {
      if (ret.cached && !isNaN(ret.cached)) {
        return next(null, parseInt(ret.cached));
      }

      MasterModel.findOne({
        where: '`key`=?',
        params: [key],
      }, function(_err, _ret) {
        if (_err) {
          return next(_err);
        }

        next(null, parseInt(_ret.value));
      });
    }],
    recache: ['version', function(ret, next) {
      if (ret.cached) {
        return next(null, null);
      }

      cache.set(key, ret.version, {ttl: Const.MINUTE_IN_MILLISECONDS}, next);
    }],
  }, function(err, ret) {
    if (err) {
      return callback(err);
    }

    callback(null, ret.version);
  });
}

module.exports = function(callback) {
  var cache = LocalCache, // maybe change to use binded closure instead of global variable
      key = null;

  async.auto({
    version: function(next) {
      getVersion(cache, next);
    },
    cached: ['version', function(ret, next) {
      key = 'masterdata-' + ret.version;
      cache.get(key, next);
    }],
    data: ['cached', function(ret, next) {
      if (ret.cached) {
        return next(null, ret.cached);
      }

      requery(ret.version, next);
    }],
    recache: ['data', function(ret, next) {
      if (ret.cached) {
        return next(null, null);
      }

      cache.set(key, ret.data, next);
    }],
  }, function(err, ret) {
    if (err) {
      callback(err);
      return;
    }

    callback(err, ret.data);
  });
};
