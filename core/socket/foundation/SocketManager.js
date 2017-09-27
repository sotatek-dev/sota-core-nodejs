/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const uuid          = require('uuid');
const util          = require('util');
const redis         = require('redis');
const Class         = require('sota-class').Class;
const logger        = log4js.getLogger('SocketManager');

const _registers = {};
const _socketServerId = uuid.v4();

const sub = redis.createClient({
  host: process.env.REDIS_SOCKET_HUB_ADDRESS,
  port: process.env.REDIS_SOCKET_HUB_PORT
});

const SocketManager = Class.singleton({
  classname: 'SocketManager',

  initialize: function () {
    logger.trace('SocketManager::initialize: ' + _socketServerId);
    const channel = 'server:' + _socketServerId;
    sub.subscribe(channel);
    sub.subscribe(Const.SOCKET_BROADCAST_CHANNEL);

    sub.on('message', function (_channel, data) {
      if (!data) {
        return;
      }

      logger.debug(util.format(
        'Socket [%s] on received message from channel [%s], data=%s',
        _socketServerId,
        _channel,
        util.inspect(data)
      ));
      const params = data.split('|');
      const handlerClassname = params[0];
      const eventType = params[1];
      const eventData = params[2];
      SocketManager.getInstance(handlerClassname).onReceivedMsgFromHub(eventType, eventData);
    });
  },

  getSocketServerId: function () {
    return ('server:' + _socketServerId);
  },

  create: function (SocketClass, server, jwtSecret) {
    const classname = SocketClass.classname;
    if (!classname) {
      throw new Error('Invalid socket classname: ' + classname);
    }

    if (_registers[classname]) {
      logger.warn(util.format('%s was already created before', classname));
      return;
    }

    const socket = new SocketClass(server, jwtSecret);
    _registers[classname] = socket;
  },

  register: function (instace) {
    _registers[instace.classname] = instace;
  },

  getInstance: function (classname) {
    return _registers[classname];
  }

});

module.exports = SocketManager;
