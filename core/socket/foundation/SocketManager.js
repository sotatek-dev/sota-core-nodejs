/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var uuid          = require('uuid')
var util          = require('util')
var redis         = require('redis')
var Class         = require('sota-class').Class
var logger        = log4js.getLogger('SocketManager')

var _registers = {}
var _socketServerId = uuid.v4()

var sub = redis.createClient({
  host: process.env.REDIS_SOCKET_HUB_ADDRESS,
  port: process.env.REDIS_SOCKET_HUB_PORT
})

var SocketManager = Class.singleton({
  classname: 'SocketManager',

  initialize: function () {
    logger.trace('SocketManager::initialize: ' + _socketServerId)
    var channel = 'server:' + _socketServerId
    sub.subscribe(channel)
    sub.on('message', function (channel, data) {
      if (!data) {
        return
      }
      logger.debug(util.format(
        'on received message from channel [%s], data=%s', channel, util.inspect(data)))
      var params = data.split('|')
      var handlerClassname = params[0]
      var eventType = params[1]
      var eventData = params[2]
      SocketManager.getInstance(handlerClassname).onReceivedMsgFromHub(eventType, eventData)
    })
  },

  getSocketServerId: function () {
    return ('server:' + _socketServerId)
  },

  create: function (SocketClass, server, jwtSecret) {
    var classname = SocketClass.classname
    if (!classname) {
      throw new Error('Invalid socket classname: ' + classname)
    }

    if (_registers[classname]) {
      logger.warn(util.format('%s was already created before', classname))
      return
    }

    var socket = new SocketClass(server, jwtSecret)
    _registers[classname] = socket
  },

  register: function (instace) {
    _registers[instace.classname] = instace
  },

  getInstance: function (classname) {
    return _registers[classname]
  }

})

module.exports = SocketManager
