/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var async         = require('async')
var util          = require('util')
var RedisCache    = require('./foundation/RedisCache')
var CacheFactory  = require('./foundation/CacheFactory')
var logger        = log4js.getLogger('Cache.getEntity')

module.exports = function (model, id, callback) {
  var tableName = model.tableName
  var key = util.format('entity-%s-%s', tableName, id)
  var isCacheHit = false
  var result = null

  async.waterfall([
    function cached (next) {
      RedisCache.hgetall(key, next)
    },
    function data (cached, next) {
      if (cached) {
        isCacheHit = true
        logger.trace(util.format('cache hit: %s<%s> data=%j', model.classname, id, cached))
        var entity = model.constructEntity(cached)
        return next(null, entity)
      }

      model.findById(id, next)
    },
    function recache (entity, next) {
      result = entity
      if (isCacheHit) {
        return next(null, result)
      }

      if (!result) {
        logger.error(util.format('Cannot find %s<%s>', model.classname, id))
        return callback(null, null)
      }

      CacheFactory.setEntity(model, id, result, next)
    }
  ], function (err) {
    if (err) {
      return callback(err)
    }

    callback(null, result)
  })
}
