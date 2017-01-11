var BaseModel   = require('./BaseModel');

module.exports = BaseModel.extends({
  classname: 'CachedModel',

  /**
   * Since we want to cache the whole entity data we cannot use this method
   * The updated entities is not explicit, so we don't know which ones need to recached
   * TODO: find a better way?
   */
  update: function($super, data, callback) {
    throw new Error('Method is not supported.');
  },

  findCacheOne: function(id, callback) {
    var self = this;

    async.auto({
      cached: function(next) {
        CacheFactory.getEntity(self.classname, id, next);
      },
      find: ['cached', function(ret, next) {
        if (!ret.cached) {
          return self.findOne(id, next);
        }

        next(null, ret.cached);
      }],
      recached: ['find', function(ret, next) {
        if (ret.cached) {
          return next(null, ret.cached);
        }

        CacheFactory.setEntity(this, id, ret.find.toJSON(), next);
      }],
    }, callback);
  },

});
