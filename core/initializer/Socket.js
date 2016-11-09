var SocketManager = require('../socket/SocketManager');
var logger        = require('log4js').getLogger('Init.Socket');
var socketIO      = require('socket.io');

module.exports = function(app, server, dirs) {
  logger.info('Start initializing SocketIO...');
  var io = socketIO(server);

  var jwtSecret = app.get('jwtSecret');
  _.each(dirs, function(dir) {
    logger.info('Initializer::Soket dir=' + dir);
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

      var module = require(file);
      SocketManager.create(module, io, jwtSecret);
    });

  });

  logger.info('Finish initializing SocketIO...');
};
