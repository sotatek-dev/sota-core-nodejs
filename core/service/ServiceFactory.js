var BaseClass = require('../common/BaseClass');
var logger    = require('log4js').getLogger('ServiceFactory');

/**
 * Hide real private objects from rest of the world
 * No outsider should be able to touch it
 */
var _registers = {};

module.exports = BaseClass.singleton({
  classname : 'ServiceFactory',

  register : function(s) {
    if (s.classname) {
      if (_registers[s.classname]) {
        logger.warn('Service is registered multiple times, will be overried: ' + s.classname);
      }
      _registers[s.classname] = s;
    }
    logger.info('registered: ' + s.classname);
  },

  get : function(classname) {
    // logger.info('get: ' + classname);
    if (!_registers[classname]) {
      throw new Error('Cannot get unregistered service: ' + classname);
    }

    return _registers[classname];
  },

});
