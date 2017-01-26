var Class         = require('sota-class').Class;
var logger        = log4js.getLogger('ExternalServiceAdapter');

var ExternalServiceAdapter = Class.singleton({
  classname: 'ExternalServiceAdapter',

  register: function(name, handler) {
    if (typeof name !== 'string' || typeof handler !== 'function') {
      throw new Error('Try to register invalid method: ' + name);
    }

    logger.trace('Registered handler: ' + name);

    if (ExternalServiceAdapter[name]) {
      logger.warn('Duplicate-name handler will be overwritten: ' + name);
    }

    ExternalServiceAdapter[name] = handler;
  },

});

module.exports = ExternalServiceAdapter;
