var BaseModel       = require('./BaseModel');
var CachedEntity    = require('../entity/CachedEntity');

module.exports = BaseModel.extends({
  classname: 'CachedModel',

  $Entity: CachedEntity,

  findCacheOne: function(id, callback) {
    CacheFactory.getEntity(this, id, callback);
  },

  _updateBatch: function($super, options, callback) {
    var self = this;
    if (!options.set) {
      logger.error(util.format('_updateBatch invalid set: %j', options));
      return callback(null, null);
    }

    async.waterfall([
      function(next) {
        $super(options, next);
      },
      function(ret, next) {
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
      },
    ], callback);
  },

});
