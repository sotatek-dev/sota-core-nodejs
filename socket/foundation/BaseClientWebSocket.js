const async     = require('async');
const WebSocket = require('ws');
const ExSession = require('../../common/ExSession');
const logger = log4js.getLogger('BaseClientWebSocket');

class BaseClientWebSocket {

  constructor (url, options) {
    this._url = url;
    this._options = options;
    this._sessions = {};
  }

  start () {
    this._ws = new WebSocket(this._url, this._options);

    // Default event
    this._ws.on('open', this._onConnected.bind(this));
    this._ws.on('close', this._onDisconnected.bind(this));

    const eventMap = this.getEventMap();
    for (let eventName in eventMap) {
      const methodName = eventMap[eventName];
      this._ws.on(eventName, this.handleEvent.bind(this, eventName, methodName));
    }
  }

  _onConnected () {
    this.onConnected();
  }

  onConnected () {
    throw new Error('Implement me in derived class');
  }

  _onDisconnected () {
    this.onDisconnected();
  }

  onDisconnected () {
    logger.trace('_onDisconnected: ' + this._url);
  }

  send (data) {
    this._ws.send(data);
  }

  handleEvent (eventName, methodName, data, flags) {
    const exSession = new ExSession();
    const sessionId = exSession.getSessionId();
    this._sessions[sessionId] = exSession;

    const finalCallback = function() {
      exSession.destroy();
      this._sessions[sessionId] = undefined;
    }

    this[methodName](exSession, data, flags, (err) => {
      if (err) {
        return exSession.rollback(finalCallback.bind(this));
      }

      return exSession.commit(finalCallback.bind(this));
    });
  }

  destroy () {
    for (let sessionId in this._sessions) {
      if (!this._sessions[sessionId]) {
        continue;
      }

      this._sessions[sessionId].destroy();
      this._sessions[sessionId] = undefined;
    }
  }

}

module.exports = BaseClientWebSocket;
