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
        socket.on(e, function(data) {
          if (!data) {
            logger.error('Invalid data for event: ' + e);
            return;
          }
          data = JSON.parse(data);
          self[self._events[e]](socket, data);
        });
      }
    }
  },

  onDisconnect: function(socket, callback) {
    // throw new Error('Must be implemented in derived class.');
    callback();
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
    var self = this,
        jwtSecret = this._jwtSecret;

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
          logger.error(err);
          return next(err, false);
        }

        logger.debug(util.format('BaseSocket::_authenticate token: %s', token));
        logger.debug(util.format('BaseSocket::_authenticate jwtPayload: %s', util.inspect(jwtPayload)));

        if (!user) {
          var err = ErrorFactory.notFound('User not found: ' + jwtPayload.userId);
          logger.error(err);
          return next(err);
        }

        var exSession = new ExSession({user: user}),
            bindMethods = ['getModel', 'getService', 'commit'];
        _.forEach(bindMethods, function(method) {
          socket[method] = exSession[method].bind(exSession);
        });

        socket.rollback = function(err) {
          exSession.rollback();
          self._io
              .of(self._namespace)
              .to(socket.id).emit('error', err);
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

});
