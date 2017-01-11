var ExSession   = require('../common/ExSession');
var BaseEntity  = require('../entity/BaseEntity');
var logger      = require('log4js').getLogger('Cache.getEntity');

module.exports = function(model, id, entity, callback) {
  var tableName = model.tableName;
  var key = util.format('entity-%s-%s', tableName, id);
  var data = (entity instanceof BaseEntity) ? entity.toJSON() : entity;

  async.waterfall([
    function cached(next) {
      RedisCache.set(key, data, next);
    },
  ], function (err) {
    if (err) {
      return callback(err);
    }

    callback(null, data);
  });

};
