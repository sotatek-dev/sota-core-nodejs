var BaseClass = require('../common/BaseClass');
var logger    = require('log4js').getLogger('SocketManager');

module.exports = BaseClass.singleton({
  classname: 'SocketManager',

  _registers: {},

  create: function(SocketClass, server, jwtSecret) {
    var classname = SocketClass.classname;
    if (!classname) {
      throw new Error('Invalid socket classname: ' + classname);
    }

    if (this._registers[classname]) {
      logger.warn(util.format('%s was already class before', classname));
      return;
    }

    var socket = new SocketClass(server, jwtSecret);
    this._registers[classname] = socket;
  }

});
