/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var async             = require('async');
var CacheFactory      = require('../cache/foundation/CacheFactory');
var BaseEntity        = require('./BaseEntity');

module.exports = BaseEntity.extends({
  classname: 'CachedEntity',

  afterSave: function ($super, callback) {
    var self = this;

    async.waterfall([
      function (next) {
        $super(next);
      },

      function cache(ret, next) {
        CacheFactory.setEntity(self.getModel(), self.id, self, next);
      }
    ], callback);
  }

});
