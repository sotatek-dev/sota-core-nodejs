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
    logger.debug(util.format('[%s]: user [%s](id:%d) connected!',
                  this._namespace, socket.user.username, socket.user.id));

    // Default behavior
    socket.on('disconnect', this._onDisconnect.bind(this, socket));

    // Customized behavior
    if (this._events) {
      var e;
      for (e in this._events) {
        socket.on(e, this[this._events[e]].bind(this, socket));
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
      UserModel.findOne({
        id: jwtPayload.userId
      }, function(err, user) {
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
