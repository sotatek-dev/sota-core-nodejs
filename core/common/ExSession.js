var Class           = require('sota-class').Class;
var uuid            = require('uuid');
var AdapterFactory  = require('../data/AdapterFactory');

module.exports = Class.extends({
  classname : 'ExSession',

  initialize: function(sessionInfo) {
    this._info = sessionInfo || {};
    this._sessionId = uuid.v4();
  },

  getSessionId: function() {
    return this._sessionId;
  },

  getService : function(classname) {
    if (!this._services) {
      this._services = {};
    }

    if (!this._services[classname]) {
      this._services[classname] = new (ServiceFactory.get(classname))(this);
    }

    return this._services[classname];
  },

  getModel : function(classname) {
    if (!this._models) {
      this._models = {};
    }

    if (!this._models[classname]) {
      this._models[classname] = ModelFactory.create(classname, this);
    }

    return this._models[classname];
  },

  /**
   * Return id of current current session's user
   */
  getUserId: function() {
    if (!this._info.user) {
      return 0;
    }

    return this._info.user.id;
  },

  isUseLocalCache: function() {
    return !!this._info.useLocalCache;
  },

  commit: function(callback) {
    var models = _.values(this._models);
    async.forEach(models, function(model, next) {
      model.singleCommit(next);
    }, callback);
  },

  rollback: function(callback) {
    var models = _.values(this._models);
    async.forEach(models, function(model, next) {
      model.singleRollback(next);
    }, callback);
  },

  destroy : function() {
    var self = this;

    var masterAdapterKeys = _.map(this._models, function(model) {
      return model.getMasterConfig().key;
    });

    var slaveAdapterKeys = _.map(this._models, function(model) {
      return model.getSlaveConfig().key;
    });

    var adapterKeys = _.uniq(_.concat(masterAdapterKeys, slaveAdapterKeys));

    _.each(adapterKeys, function(key) {
      AdapterFactory.unregister(self, key);
    });

    for (let i in this._services) {
      this._services[i].destroy();
    }

    for (let i in this._models) {
      this._models[i].destroy();
    }

    delete this._sessionId;
    delete this._services;
    delete this._models;
  }

});
