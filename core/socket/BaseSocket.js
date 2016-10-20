var socketIO      = require('socket.io');
var BaseClass     = require('../common/BaseClass');
var logger        = require('log4js').getLogger('BaseSocket');

module.exports = BaseClass.extend({
  classname: 'BaseSocket',
  _namespace: '/',

  _events: {},

  initialize: function(server, jwtSecret) {
    // logger.debug(this.classname + '::initialize jwtSecret=' + jwtSecret);
    var self = this,
        io = socketIO(server);

    io.of(self._namespace)
      .use(self._authenticate.bind(self))
      .on('connection', self._onConnection.bind(self));

    self._io = io;
    self._jwtSecret = jwtSecret;
  },

  _onConnection: function(socket) {
    var self = this;
    logger.debug(util.format('[%s]: user [%s](id:%d) connected! (socketId: %s)',
                  self._namespace, socket.user.username, socket.user.id, socket.id));

    // Default behavior
    socket.on('disconnect', self._onDisconnect.bind(self, socket));

    // Customized behavior
    if (self._events) {
      var e;
      for (e in self._events) {
        socket.on(e, self[self._events[e]].bind(self, socket));
      }
    }
  },

  _onDisconnect: function(socket) {
    logger.debug(util.format('[%s]: user [%s](id:%d) disconnected!',
                  this._namespace, socket.user.username, socket.user.id));
  },

  _authenticate: function(socket, next) {
    var jwtSecret = this._jwtSecret;

    try {
      var token = socket.request._query.auth_token;
      var jwtPayload = jwt.decode(token, jwtSecret);
      var UserModel = ModelFactory.create('UserModel');
      UserModel.findOne(jwtPayload.userId, function(err, user) {
        if (err) {
          return next(err, false);
        }

        if (!user) {
          next(null, false);
        }

        socket.user = user;
        next(null, true);

      });
    } catch (e) {
      logger.error(e);
      next(e, false);
    }
  },

});
