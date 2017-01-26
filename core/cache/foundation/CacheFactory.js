var Class   = require('sota-class').Class;
var logger  = log4js.getLogger('CacheFactory');

'use strict';

var CacheFactory = Class.singleton({
  classname: 'CacheFactory',

  register: function(name, func) {
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

    if (CacheFactory[name]) {
      logger.warn('Duplicate cache name will be overwritten: ' + name);
    }

    CacheFactory[name] = func;
  }
});

module.exports = CacheFactory;
