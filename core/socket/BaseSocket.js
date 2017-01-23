var jwt               = require('jwt-simple');
var Class             = require('sota-class').Class;
var ExSession         = require('../common/ExSession');
var SocketIOWrapper   = require('./SocketIOWrapper');
var logger            = require('log4js').getLogger('BaseSocket');

var client = redis.createClient({
  host: process.env.REDIS_SOCKET_HUB_ADDRESS,
  port: process.env.REDIS_SOCKET_HUB_PORT,
});

module.exports = Class.extends({
  classname: 'BaseSocket',
  _namespace: '/',

  _events: {},

  initialize: function(io, jwtSecret) {
    // logger.debug(this.classname + '::initialize jwtSecret=' + jwtSecret);
    var self = this;

    io.of(self._namespace)
      .use(self._authenticate.bind(self))
      .on('connection', self._onConnection.bind(self));

    self._io = io;
    self._jwtSecret = jwtSecret;
  },

  onDisconnect: function(socket, callback) {
    // Should be overrided in subclass
    // throw new Error('Must be implemented in derived class.');
    callback();
  },

  _onConnection: function(socket) {
    var self = this;
    logger.debug(util.format('[%s]: user [%s](id:%d) connected! (socketId: %s)',
                  self._namespace, socket.user.username, socket.user.id, socket.id));

    // Default behavior
    socket.on('join-room', self._onRoomChanged.bind(self, socket));
    socket.on('disconnect', self._onDisconnect.bind(self, socket));

    // Customized behavior
    if (self._events) {
      for (let e in self._events) {
        socket.on(e, function(data) {
          if (!data) {
            socket.emit('error', ErrorFactory.badRequest('Invalid data for event: ' + e));
            return;
          }

          self[self._events[e]](socket, data);
        });
      }
    }
  },

  _onRoomChanged: function(socket, roomId) {
    var self = this;
    if (isNaN(roomId)) {
      try {
        // TODO: Is client able to send object to server?
        roomId = JSON.parse(roomId).roomId;
      } catch (e) {
        socket.emit('error', e.toString());
        return;
      }
    }

    if (roomId === socket.currentRoomId) {
      return;
    }

    var user = socket.user;
    socket.previousRoomId = socket.currentRoomId;
    socket.currentRoomId = roomId;

    logger.debug(util.format('[%s]: user [%s](id:%d) changed room from [%s] to [%s]',
      self._namespace, user.username, user.id, socket.previousRoomId, socket.currentRoomId));

    socket.leave(socket.previousRoomId);
    socket.join(socket.currentRoomId);

    socket.emit('room-changed', socket.currentRoomId);
    self.onRoomChanged(socket);
  },

  _onDisconnect: function(socket) {
    logger.debug(util.format('[%s]: user [%s](id:%d) disconnected!',
                  this._namespace, socket.user.username, socket.user.id));

    this.onDisconnect(socket, function(err) {
      if (err) {
        logger.error(err);
      }

      if (socket.exSession) {
        socket.exSession.rollback(function() {
          socket.exSession.destroy();
          delete socket.exSession;
        });
      }
    });
  },

  _authenticate: function(socket, next) {
    var self = this,
        jwtSecret = this._jwtSecret;

    try {
      var token = socket.request._query.auth_token;
      if (!token) {
        logger.warn(util.format('%s::_authenticate invalid token: %s',
          self.classname, util.inspect(token)));
        socket.emit('disconnect');
        return;
      }
      var jwtPayload = jwt.decode(token, jwtSecret);
      CacheFactory.getOneUser(jwtPayload.userId, function(err, user) {
        if (err) {
          logger.error(err);
          socket.emit('disconnect');
          return next(err, false);
        }

        logger.debug(util.format('BaseSocket::_authenticate token: %s', token));
        logger.debug(util.format('BaseSocket::_authenticate jwtPayload: %s',
          util.inspect(jwtPayload)));

        if (!user) {
          let e = ErrorFactory.notFound('User not found: ' + jwtPayload.userId);
          logger.error(e);
          socket.emit('disconnect');
          return next(e);
        }

        var exSession = new ExSession({user: user}),
            bindMethods = ['getModel', 'getService', 'commit'];
        _.forEach(bindMethods, function(method) {
          socket[method] = exSession[method].bind(exSession);
        });

        socket.rollback = function(e) {
          exSession.rollback();
          self._io
              .of(self._namespace)
              .to(socket.id).emit('error', e);
        };

        socket.user = user;
        socket.exSession = exSession;

        next(null, true);

      });
    } catch (e) {
      logger.error(e);
      return next(e, false);
    }
  },

  getRedisHubClient: function() {
    return client;
  },

  publishToHub: function(channel, eventType, eventData) {
    if (typeof channel !== 'string') {
      throw new Error('Invalid channel to publish: ' + eventData);
    }

    if (typeof eventData !== 'string') {
      throw new Error('Invalid eventData to publish: ' + eventData);
    }

    var message = [this.classname, eventType, eventData].join('|');
    client.publish(channel, message);
  },

  onReceivedMsgFromHub: function(data) {
    throw new Error('Implement me in derived class.');
  },

}).implements([SocketIOWrapper]);
