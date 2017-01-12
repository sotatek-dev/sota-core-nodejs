var BaseEntity  = require('../entity/BaseEntity');
var logger      = require('log4js').getLogger('Cache.getEntity');

/**
 * This cache method is not really ready to use yet
 * TODO: find the way to update cache whenever the DB is updated
 */
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
