var WebSocket = require('ws');
var Class = require('sota-class').Class;
var ExSession = require('../../common/ExSession');
var logger = log4js.getLogger('BaseClientWebSocket');

module.exports = Class.extends({
  classname: 'BaseClientWebSocket',

  $_events: {},

  initialize: function (url, options) {
    this._exSession = new ExSession();
    this._url = url;
    this._options = options;
  },

  start: function () {
    var self = this;

    this._ws = new WebSocket(this._url, this._options);

    // Default event
    this._ws.on('open', this._onConnected.bind(this));
    this._ws.on('close', this._onDisconnected.bind(this));

    // Customized events
    if (self._events) {
      for (let e in self._events) {
        self._ws.on(e, function (data, flags) {
          self[self._events[e]](data, flags);
        });
      }
    }
  },

  _onConnected: function () {
    this.onConnected();
  },

  onConnected: function () {
    throw new Error('Implement me in derived class');
  },

  _onDisconnected: function () {
    this.onDisconnected();
  },

  onDisconnected: function () {
    logger.trace('_onDisconnected: ' + this._url);
  },

  send: function (data) {
    this._ws.send(data);
  },

  getModel: function (classname) {
    return this._exSession.getModel(classname);
  },

  getService: function (classname) {
    return this._exSession.getService(classname);
  },

  rollback: function (callback) {
    this._exSession.rollback(callback);
  },

  commit: function (callback) {
    this._exSession.commit(callback);
  },

  destroy: function () {
    this._exSession.destroy();
    delete this._exSession;
  }

});
