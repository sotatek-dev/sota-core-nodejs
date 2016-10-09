var BaseClass = require('./BaseClass');

module.exports = BaseClass.extend({
  classname : 'ExSession',

  _sessionId : '',

  getService : function(classname) {
    if (!this._services) {
      this._services = {};
    }

    if (!this._services[classname]) {
      this._services[classname] = new (ServiceFactory.get(classname))(this);
    }

    return this._services[classname];
  },

  getModel : function(classname, dsConfig) {
    if (!this._models) {
      this._models = {};
    }

    if (!this._models[classname]) {
      this._models[classname] = ModelFactory.create(classname, this, dsConfig);
    }

    return this._models[classname];
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
    var i;
    for (i in this._services) {
      this._services[i].destroy();
    }

    for (i in this._models) {
      this._models[i].destroy();
    }

    delete this._services;
    delete this._models;
  }

});
