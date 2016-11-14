var Class     = require('sota-class').Class;
var logger    = require('log4js').getLogger('SocketManager');

var _registers = {};

module.exports = Class.singleton({
  classname: 'SocketManager',

  create: function(SocketClass, server, jwtSecret) {
    var classname = SocketClass.classname;
    if (!classname) {
      throw new Error('Invalid socket classname: ' + classname);
    }

    if (_registers[classname]) {
      logger.warn(util.format('%s was already created before', classname));
      return;
    }

    var socket = new SocketClass(server, jwtSecret);
    _registers[classname] = socket;
  },

  getInstance: function(classname) {
    return _registers[classname];
  }

});
