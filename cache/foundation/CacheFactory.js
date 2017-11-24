const Class = require('sota-class').Class;
const logger = log4js.getLogger('CacheFactory');

'use strict';

let isCoreModuleDefs = {};

let CacheFactory = Class.singleton({
  classname: 'CacheFactory',

  register: function (name, func, isCoreModule) {
    if (typeof name !== 'string' || typeof func !== 'function') {
      throw new Error('Try to register invalid method: ' + name);
    }

    logger.trace('Registered cache: ' + name);

    if (typeof name === 'function') {
      func = name;
      name = func.name;
    } else if (!name) {
      name = func.name;
    }

    if (CacheFactory[name] && isCoreModuleDefs[name] === isCoreModule) {
      logger.warn('Duplicate cache name will be overwritten: ' + name);
    }

    isCoreModuleDefs[name] = isCoreModule;
    CacheFactory[name] = func;
  }
});

module.exports = CacheFactory;
