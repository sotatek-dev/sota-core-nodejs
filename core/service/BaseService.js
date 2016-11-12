var Class       = require('sota-class').Class;
var logger      = require('log4js').getLogger('BaseService');

module.exports = Class.extends({
  classname : 'BaseService',

  initialize : function(exSession) {
    // logger.trace('BaseService<' + this.classname + '>::initialize');
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

  destroy : function() {
    delete this._exSession;
  },

});
