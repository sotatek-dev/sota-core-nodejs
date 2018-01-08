/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const _               = require('lodash');
const async           = require('async');
const LocalCache      = require('../cache/foundation/LocalCache');
const Const           = require('../common/Const');
const BaseModel       = require('./BaseModel');

/**
 * The masterdata's tables
 * TODO: implement this
 */
module.exports = BaseModel.extends({
  classname: 'VersionedModel',

  $getCacheKey: function () {
    return `${this.tableName}-cached`;
  },

  getAll: function (callback) {
    const key = this.getCacheKey();
    const cachedData = LocalCache.getSync(key);

    // Cache hit. Just return
    if (cachedData) {
      return callback(null, cachedData);
    }

    // Query in DB
    this._select({
      limit: 9999
    }, (err, ret) => {
      if (err) {
        return callback(err);
      }

      const data = _.filter(ret, function (e) {
        return _.isNil(e.isActive) || e.isActive > 0;
      });

      LocalCache.setSync(key, data, { ttl: Const.YEAR_IN_MILLISECONDS });
      return callback(null, data);
    });
  },

  getByVersion: function (version, callback) {
    // TODO: implement this
    this.getAll(callback);
  },

  findById: function (id, callback) {
    this.findCacheOne(id, callback);
  },

  findCacheOne: function (id, callback) {
    async.waterfall([
      (next) => {
        this.getAll(next);
      },

      (entities, next) => {
        const result = _.find(entities, e => _.isEqual(id, e.id)) || null;
        next(null, result);
      }
    ], callback);
  },

  $flushLocalData: function() {
    const key = this.getCacheKey();
    LocalCache.removeSync(key);
  },

});
