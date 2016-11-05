var BaseClass   = require('../common/BaseClass');
var logger      = require('log4js').getLogger('BaseService');

module.exports = BaseClass.extend({
  classname : 'BaseService',

  initialize : function(exSession) {
    // logger.info('BaseService<' + this.classname + '>::initialize');
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
