var Class     = require('sota-class').Class;
var logger    = log4js.getLogger('ServiceFactory');

/**
 * Hide real private objects from rest of the world
 * No outsider should be able to touch it
 */
var _registers = {};

module.exports = Class.singleton({
  classname : 'ServiceFactory',

  register : function(s) {
    if (s.classname) {
      if (_registers[s.classname]) {
        logger.warn('Service is registered multiple times, will be overried: ' + s.classname);
      }
      _registers[s.classname] = s;
    }
    logger.trace('registered: ' + s.classname);
  },

  get : function(classname) {
    // logger.trace('get: ' + classname);
    if (!_registers[classname]) {
      throw new Error('Cannot get unregistered service: ' + classname);
    }

    return _registers[classname];
  },

  create: function(classname, exSession) {
    ServiceClass = this.get(classname);
    return (new ServiceClass)(exSession);
  },

});
