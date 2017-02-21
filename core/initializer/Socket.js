var SocketManager = require('../socket/SocketManager');
var logger        = log4js.getLogger('Init.Socket');
var socketIO      = require('socket.io');
var redisio       = require('socket.io-redis');

module.exports = function(jwtSecret, server, dirs) {
  logger.trace('Start initializing SocketIO...');
  var io = socketIO(server);
  io.engine.ws = new (require('uws').Server)({
      noServer: true,
      perMessageDeflate: false
  });

  io.adapter(redisio({
    host: process.env.REDIS_SOCKET_HUB_ADDRESS,
    port: process.env.REDIS_SOCKET_HUB_PORT,
  }));

  _.each(dirs, function(dir) {
    logger.trace('Initializer::Soket dir=' + dir);
    if (!FileUtils.isDirectorySync(dir)) {
      throw new Error('Invalid service directory: ' + dir);
    }

    var files = FileUtils.listFiles(dir, /.js$/i);
    if (!files.length) {
      logger.warn('Socket directory (' + dir + ') is empty');
      return;
    }

    _.forEach(files, function(file) {
      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid socket file: ' + file);
      }

      if (file.indexOf('SocketManager') > -1) {
        // Ignore non-socket classes
        return;
      }

      var module = require(file);
      SocketManager.create(module, io, jwtSecret);
    });

  });

  logger.trace('Finish initializing SocketIO...');
};
