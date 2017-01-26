var BaseEntity  = require('../entity/BaseEntity');
var logger      = log4js.getLogger('Cache.setEntity');

module.exports = function(model, id, entity, callback) {
  async.waterfall([
    function cached(next) {
      var tableName = model.tableName;
      var key = util.format('entity-%s-%s', tableName, id);
      var data = (entity instanceof BaseEntity) ? entity.toJSON() : entity;
      logger.trace(util.format('cache set: %s<%s>, data=%j', model.classname, id, data));
      RedisCache.hmset(key, data, next);
    },
  ], function (err) {
    if (err) {
      return callback(err);
    }

    callback(null, entity);
  });

};
