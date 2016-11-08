var logger    = require('log4js').getLogger('PolicyManager');
var Class     = require('../common/Class');

module.exports = Class.singleton({
  classname: 'PolicyManager',

  _registers: {},

  register : function(name, handler) {
    if (!name) {
      throw new Error('Cannot register policy with empty name: ' + handler);
    }

    if (!handler || typeof handler !== 'function') {
      throw new Error('Cannot register policy with invalid handler: ' + handler);
    }

    if (name) {
      if (this._registers[name]) {
        logger.warn('Policy is registered multiple times, will be overried: ' + name);
      }
      this._registers[name] = handler;
    }
    logger.info('Registered policy: ' + name);
  },

  get : function(name) {
    return this._registers[name];
  },

});
