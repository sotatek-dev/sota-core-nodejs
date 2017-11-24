/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _                   = require('lodash');
var async               = require('async');
var util                = require('util');
var BaseModel           = require('./BaseModel');
var CachedEntity        = require('../entity/CachedEntity');
var CacheFactory        = require('../cache/foundation/CacheFactory');
var logger              = log4js.getLogger('CachedModel');

module.exports = BaseModel.extends({
  classname: 'CachedModel',

  $Entity: CachedEntity,

  findCacheOne: function ($super, data, callback) {
    if (typeof data === 'number' || typeof data === 'string') {
      return CacheFactory.getEntity(this, data, callback);
    }

    $super(data, callback);
  },

  _updateBatch: function ($super, options, callback) {
    var self = this;
    if (!options.set) {
      logger.error(util.format('_updateBatch invalid set: %j', options));
      return callback(null, null);
    }

    async.waterfall([
      function (next) {
        $super(options, next);
      },

      function (ret, next) {
        var where = options.where || '1=1';
        var params = options.params || [];
        var setVarCount = (options.set.match(/\?/g) || []).length;
        params = params.slice(setVarCount);
        self.find({
          where: where,
          params: params
        }, next);
      },

      function resetCache(entities, next) {
        if (!entities || !entities.length) {
          return next(null, true);
        }

        var ids = _.map(entities, 'id');
        CacheFactory.removeEntity(self, ids, next);
      }
    ], callback);
  }

});
