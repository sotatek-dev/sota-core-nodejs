/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const Class     = require('sota-class').Class;
const logger    = log4js.getLogger('ServiceFactory');

/**
 * Hide real private objects from rest of the world
 * No outsider should be able to touch it
 */
let _registers = {};

module.exports = Class.singleton({
  classname: 'ServiceFactory',

  register: function (s, isCoreModule) {
    if (!s.classname) {
      logger.error(`Trying to register invalid service: ${s}`);
      return;
    }

    const classname = s.classname;

    if (_registers[classname] && _registers[classname].isCoreModule === isCoreModule) {
      logger.warn('Service is registered multiple times, will be overried: ' + classname);
    }

    _registers[classname] = { module: s, isCoreModule: isCoreModule };

    logger.trace('Registered: ' + classname);
  },

  get: function (classname) {
    if (!_registers[classname]) {
      throw new Error('Cannot get unregistered service: ' + classname);
    }

    return _registers[classname].module;
  },

  create: function (classname, exSession) {
    const ServiceClass = this.get(classname);
    return new ServiceClass(exSession);
  }

});
