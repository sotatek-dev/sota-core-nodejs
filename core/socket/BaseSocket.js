var jwt           = require('jwt-simple');
var Class         = require('../common/Class');
var ExSession     = require('../common/ExSession');
var logger        = require('log4js').getLogger('BaseSocket');

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

  _onConnection: function(socket) {
    var self = this;
    logger.debug(util.format('[%s]: user [%s](id:%d) connected! (socketId: %s)',
                  self._namespace, socket.user.username, socket.user.id, socket.id));

    // Default behavior
    socket.on('disconnect', self._onDisconnect.bind(self, socket));

    // Customized behavior
    if (self._events) {
      for (let e in self._events) {
        socket.on(e, self[self._events[e]].bind(self, socket));
      }
    }
  },

  onDisconnect: function(socket, callback) {
    throw new Error('Must be implemented in derived class.');
  },

  _onDisconnect: function(socket) {
    logger.debug(util.format('[%s]: user [%s](id:%d) disconnected!',
                  this._namespace, socket.user.username, socket.user.id));

    this.onDisconnect(socket, function(err) {
      if (err) {
        logger.error(err);
      }

      if (socket.exSession) {
        socket.exSession.destroy();
        delete socket.exSession;
      }
    });
  },

  _authenticate: function(socket, next) {
    var jwtSecret = this._jwtSecret;

    try {
      var token = socket.request._query.auth_token;
      var jwtPayload = jwt.decode(token, jwtSecret);
      var UserModel = ModelFactory.create('UserModel', new ExSession());
      UserModel.findOne(jwtPayload.userId, function(err, user) {
        // When a model is not got from request, need to destroy manually
        // to prevent connection leak
        // TODO: Implement a generic mechanism to handle this
        UserModel.destroy();
        delete UserModel;

        if (err) {
          return next(err, false);
        }

        if (!user) {
          return next(ErrorFactory.notFound('User not found: ' + jwtPayload.userId));
        }

        socket.user = user;
        socket.exSession = new ExSession({user: user});
        socket.getModel = function getModel(classname) {
          return exSession.getModel(classname);
        };

        socket.getService = function getService(classname) {
          return exSession.getService(classname);
        };

        next(null, true);

      });
    } catch (e) {
      logger.error(e);
      return next(e, false);
    }
  },

});
