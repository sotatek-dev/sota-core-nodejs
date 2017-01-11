var ExSession   = require('../common/ExSession');
var BaseEntity  = require('../entity/BaseEntity');
var logger      = require('log4js').getLogger('Cache.getEntity');

/**
 * This cache method is not ready to use yet
 * TODO: find the way to update cache whenever the DB is updated
 */
module.exports = function(model, id, callback) {
  var tableName = model.tableName;
  var key = util.format('entity-%s-%s', tableName, id);
  var result = null;

  async.waterfall([
    function cached(next) {
      RedisCache.get(key, next);
    },
    function get(cached, next) {
      if (cached) {
        try {
          result = JSON.parse(cached);
        } catch(e) {
          logger.error(util.format('Invalid cached entity: tableName=%s, id=%s', tableName, id));
          logger.error(e);
        }
        return next(null, result);
      }

      model.findOne(id, next);
    },
    function recache(entity, next) {
      if (entity instanceof BaseEntity) {
        result = entity.toJSON();
      }

      RedisCache.set(JSON.stringify(result), next);
    },
  ], function (err) {
    if (err) {
      return callback(err);
    }

    callback(null, result);
  });

};
