var BaseClass = require('../common/BaseClass');
var logger    = require('log4js').getLogger('ServiceFactory');

var ServiceFactory = BaseClass.singleton({
  classname : 'ServiceFactory',

  _registers : {},

  register : function(s) {
    if (s.classname) {
      if (this._registers[s.classname]) {
        logger.warn('Service is registered multiple times, will be overried: ' + s.classname);
      }
      this._registers[s.classname] = s;
    }
    logger.info('registered: ' + s.classname);
  },

  get : function(classname) {
    // logger.info('get: ' + classname);
    if (!this._registers[classname]) {
      throw new Error('Cannot get unregistered service: ' + classname);
    }

    return this._registers[classname];
  },

});

module.exports = ServiceFactory;
