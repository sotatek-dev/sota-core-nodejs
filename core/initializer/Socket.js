/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _               = require('lodash')
var FileUtils       = require('../util/FileUtils')
var SocketManager   = require('../socket/foundation/SocketManager')
var SocketIO        = require('socket.io')
var redisio         = require('socket.io-redis')
var logger          = log4js.getLogger('Init.Socket')

module.exports = function (jwtSecret, server, dirs) {
  logger.trace('Start initializing SocketIO...')
  var io = SocketIO(server)
  io.engine.ws = new (require('uws').Server)({
    noServer: true,
    perMessageDeflate: false
  })

  io.adapter(redisio({
    host: process.env.REDIS_SOCKET_HUB_ADDRESS,
    port: process.env.REDIS_SOCKET_HUB_PORT
  }))

  _.each(dirs, function (dir) {
    logger.trace('Initializer::Soket dir=' + dir)
    if (!FileUtils.isDirectorySync(dir)) {
      throw new Error('Invalid service directory: ' + dir)
    }

    var files = FileUtils.listFiles(dir, /.js$/i)
    if (!files.length) {
      logger.warn('Socket directory (' + dir + ') is empty')
      return
    }

    _.forEach(files, function (file) {
      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid socket file: ' + file)
      }

      var module = require(file)
      SocketManager.create(module, io, jwtSecret)
    })
  })

  logger.trace('Finish initializing SocketIO...')
}
