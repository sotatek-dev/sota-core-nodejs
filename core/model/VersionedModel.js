var BaseModel   = require('./BaseModel');

/**
 * The masterdata's tables
 * TODO: implement this
 */
module.exports = BaseModel.extends({
  classname: 'VersionedModel',

  getCacheKey: function(version) {
    if (!version) {
      version = 0;
    }

    return this.tableName + '-' + version + '-cached';
  },

  getAll: function(callback) {
    var self = this;
    var key = this.getCacheKey();

    async.auto({
      cached: function(next) {
        var cached = LocalCache.getSync(key);
        if (cached) {
          return next(null, cached);
        }

        next(null, null);
      },
      data: ['cached', function(ret, next) {
        if (ret.cached) {
          return next(null, ret.cached);
        }

        self._select({
          limit: 9999
        }, next);
      }],
      recache: ['data', function(ret, next) {
        if (!ret.cached) {
          LocalCache.setSync(key, ret.data, {ttl: Const.YEAR_IN_MILLISECONDS});
        }
        next();
      }]
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }

      callback(null, ret.data);
    });
  },

  getByVersion: function(version, callback) {
    // TODO: implement this
    this.getAll(callback);
  },

});
