var Class       = require('sota-class').Class;
var logger      = require('log4js').getLogger('BaseService');

var registryId = 0;

module.exports = Class.extends({
  classname : 'BaseService',

  initialize : function(exSession) {
    this.registryId = ++registryId;
    logger.trace('BaseService<' + this.classname + '>::initialize registryId=' + this.registryId);
    if (!exSession) {
      throw new Error('Invalid exSession: ' + exSession);
    }
    this._exSession = exSession;
  },

  getModel : function(classname) {
    return this._exSession.getModel(classname);
  },

  getService : function(classname) {
    return this._exSession.getService(classname);
  },

  getExSession: function() {
    return this._exSession;
  },

  destroy : function() {
    delete this._exSession;
  },

});
