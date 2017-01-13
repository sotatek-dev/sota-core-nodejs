var logger      = require('log4js').getLogger('Cache.getEntity');

module.exports = function(model, id, callback) {
  var tableName = model.tableName;
  var key = util.format('entity-%s-%s', tableName, id);
  var isCacheHit = false;
  var result = null;

  async.waterfall([
    function cached(next) {
      RedisCache.hgetall(key, next);
    },
    function data(cached, next) {
      if (cached) {
        isCacheHit = true;
        logger.trace(util.format('cache hit: %s<%s>', model.classname, id));
        var entity = model.constructEntity(cached);
        return next(null, entity);
      }

      model.findOne(id, next);
    },
    function recache(entity, next) {
      result = entity;
      if (isCacheHit) {
        return next(null, result);
      }

      RedisCache.hmset(key, result.toJSON(), next);
    },
  ], function (err) {
    if (err) {
      return callback(err);
    }

    callback(null, result);
  });

};
