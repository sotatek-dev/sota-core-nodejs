const _                 = require('lodash');
const util              = require('util');
const redis             = require('redis');
const jwt               = require('jwt-simple');
const Class             = require('sota-class').Class;
const CacheFactory      = require('../cache/foundation/CacheFactory');
const ErrorFactory      = require('../error/ErrorFactory');
const ExSession         = require('../common/ExSession');
const SocketIOWrapper   = require('./foundation/SocketIOWrapper');
const logger            = require('../index').getLogger('BaseSocket');

let client;
if (process.env.REDIS_SOCKET_HUB_ADDRESS) {
  client = redis.createClient({
    host: process.env.REDIS_SOCKET_HUB_ADDRESS,
    port: process.env.REDIS_SOCKET_HUB_PORT,
    password: process.env.REDIS_SOCKET_HUB_PASSWORD || undefined
  });
}

module.exports = Class.extends({
  classname: 'BaseSocket',
  _namespace: '/',

  _events: {},

  initialize: function (io, jwtSecret) {
    // logger.debug(this.classname + '::initialize jwtSecret=' + jwtSecret)
    io.of(this._namespace)
      .use(this._authenticate.bind(this))
      .on('connection', this._onConnection.bind(this));

    this._io = io;
    this._jwtSecret = jwtSecret;
  },

  onConnect: function (socket) {
    // Should be overrided in subclass
    throw new Error('Must be implemented in derived class.')
  },

  onDisconnect: function (socket, callback) {
    // Should be overrided in subclass
    // throw new Error('Must be implemented in derived class.')
    callback();
  },

  _onConnection: function (socket) {
    logger.trace(util.format('[%s]: user [%s](id:%d) connected! (socketId: %s)',
                  this._namespace, socket.user.username, socket.user.id, socket.id));

    // Default behavior
    socket.on('join-room', this._onJoinRoom.bind(this, socket));
    socket.on('leave-room', this._onLeaveRoom.bind(this, socket));
    socket.on('disconnect', this._onDisconnect.bind(this, socket));

    // Customized behavior
    if (this._events) {
      for (let e in this._events) {
        socket.on(e, (data) => {
          if (!data) {
            socket.emit('error', ErrorFactory.badRequest('Invalid data for event: ' + e));
            return;
          }

          this[this._events[e]](socket, data);
        });
      }
    }

    this.onConnect(socket);
  },

  _onJoinRoom: function (socket, roomId) {
    socket.join(roomId);
    socket.emit('room-joined', roomId);

    if (typeof this.onRoomJoined === 'function') {
      this.onRoomJoined(socket, roomId);
    }
  },

  _onLeaveRoom: function (socket, roomId) {
    socket.join(roomId);
    socket.emit('room-left', roomId);

    if (typeof this.onRoomLeft === 'function') {
      this.onRoomLeft(socket, roomId);
    }
  },

  _onDisconnect: function (socket) {
    logger.debug(util.format('[%s]: user [%s](id:%d) disconnected!',
                  this._namespace, socket.user.username, socket.user.id));

    this.onDisconnect(socket, (err) => {
      if (err) {
        logger.error(err);
      }

      if (socket.exSession) {
        socket.exSession.rollback(() => {
          socket.exSession.destroy();
          delete socket.exSession;
        });
      }
    });
  },

  _authenticate: function (socket, callback) {
    const jwtSecret = this._jwtSecret;

    try {
      const token = socket.request._query.auth_token;
      if (!token) {
        logger.warn(util.format('%s::_authenticate invalid token: %s',
          this.classname, util.inspect(token)));
        socket.emit('disconnect');
        return;
      }

      const jwtPayload = jwt.decode(token, jwtSecret);
      CacheFactory.getOneUser(jwtPayload.userId, (err, user) => {
        if (err) {
          logger.error(err);
          socket.emit('disconnect');
          return callback(err, false);
        }

        logger.trace(util.format('BaseSocket::_authenticate token: %s', token));
        logger.trace(util.format('BaseSocket::_authenticate jwtPayload: %s',
          util.inspect(jwtPayload)));

        if (!user) {
          let e = ErrorFactory.unauthorized('User not found: ' + jwtPayload.userId);
          logger.error(e);
          socket.emit('disconnect');
          return callback(e);
        }

        this._onAuthenticated(socket, user, callback);
      });
    } catch (e) {
      logger.error(e);
      return callback(e, false);
    }
  },

  _onAuthenticated: function(socket, user, callback) {
    const exSession = new ExSession({ user: user });
    const bindMethods = ['getModel', 'getService', 'commit'];

    _.forEach(bindMethods, (method) => {
      socket[method] = exSession[method].bind(exSession);
    });

    socket.rollback = (e) => {
      logger.warn(util.format('%s: something went wrong, err=%j', this.classname, e));
      exSession.rollback();
      if (e) {
        this._io.of(this._namespace).to(socket.id).emit('socketError', e);
      }
    };

    socket.user = user;
    socket.exSession = exSession;

    callback(null, true);
  },

  $getRedisHubClient: function () {
    return client;
  },

  publishToHub: function (channel, eventType, eventData) {
    if (typeof channel !== 'string') {
      throw new Error('Invalid channel to publish: ' + eventData);
    }

    if (typeof eventData !== 'string') {
      throw new Error('Invalid eventData to publish: ' + eventData);
    }

    const message = [this.classname, eventType, eventData].join('|');
    client.publish(channel, message);
  },

  onReceivedMsgFromHub: function (data) {
    throw new Error('Implement me in derived class.');
  }

}).implements([SocketIOWrapper]);
