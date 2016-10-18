var SocketIO      = require('socket.io');
var BaseClass     = require('../common/BaseClass');
var logger        = require('log4js').getLogger('BaseSocket');

module.exports = BaseClass.extend({
  classname: 'BaseSocket',
  _namespace: '/',

  _events: {},

  initialize: function(server, jwtSecret) {
    // logger.debug(this.classname + '::initialize jwtSecret=' + jwtSecret);
    var self = this,
        io = SocketIO(server);

    io.of(this._namespace)
      .use(this._authenticate.bind(this))
      .on('connection', this._onConnection.bind(this));

    this._io = io;
    this._jwtSecret = jwtSecret;
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
    var err = null,
        isOK = true,
        jwtSecret = this._jwtSecret;

    try {
      // var token = socket.handshake.query.auth_token;
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
      err = e;
      isOK = false;
      next(e, false);
    }
  },

});