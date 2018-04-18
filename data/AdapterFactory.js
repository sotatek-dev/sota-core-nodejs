/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const util            = require('util');
const Class           = require('sota-class').Class;
const MySQLAdapter    = require('./mysql/MySQLAdapter');
const MongoAdapter    = require('./mongodb/MongoAdapter');
const Const           = require('../common/Const');
const MySQL           = require('mysql');

const _registry = {};
const _pools = {};

module.exports = Class.singleton({
  classname: 'AdapterFactory',

  create: function (exSession, config, mode) {
    if (!exSession || !exSession.getSessionId()) {
      throw new Error('AdapterFactory::create invalid config: config=' + util.inspect(config));
    }

    if (!config || !config.key) {
      throw new Error('AdapterFactory::create invalid config: config=' + util.inspect(config));
    }

    const type = config.type;
    const key = config.key;

    this._createPool(config);

    if (type === Const.DATA_SOURCE_TYPE.MYSQL) {
      return this._createMySQLAdapter(exSession, key, mode);
    } else if (type === Const.DATA_SOURCE_TYPE.MONGODB) {
      return this._createMongodbAdapter(exSession, key, mode);
    } else {
      throw new Error('AdapterFactory::create unsupported type config=' + util.inspect(config));
    }
  },

  _createMongodbAdapter: function (exSession, key, mode) {
    if (!_registry[key]) {
      _registry[key] = {};
    }

    const sessionId = exSession.getSessionId();
    if (!_registry[key][sessionId]) {
      const adapter = new MongoAdapter(exSession, mode);
      _registry[key][sessionId] = adapter;
    }

    return _registry[key][sessionId];
  },

  _createMySQLAdapter: function (exSession, key, mode) {
    if (!_registry[key]) {
      _registry[key] = {};
    }

    const sessionId = exSession.getSessionId();
    if (!_registry[key][sessionId]) {
      const adapter = new MySQLAdapter(exSession, _pools[key].instance, mode);
      _registry[key][sessionId] = adapter;
    }

    return _registry[key][sessionId];
  },

  _createPool: function (config) {
    const type = config.type;
    const key = config.key;

    if (_pools[key]) {
      return;
    }

    let pool;

    if (type === Const.DATA_SOURCE_TYPE.MYSQL) {
      pool = MySQL.createPool({
        host: config.dbHost,
        user: config.dbUser,
        password: config.dbPwd,
        database: config.dbName,
        port: config.dbPort || 3306,
        connectionLimit: config.connectionLimit || 10,
        waitForConnections: config.waitForConnections || true,
        queueLimit: config.queueLimit || 5,
        charset: 'utf8mb4_general_ci'
      });
    } else if (type === Const.DATA_SOURCE_TYPE.MONGODB) {
      pool = {};
    } else {
      throw new Error('AdapterFactory::_createPool unsupport type config=' + util.inspect(config));
    }

    _pools[key] = {};
    _pools[key].config = config;
    _pools[key].instance = pool;
  },

  unregister: function (exSession, key) {
    if (_registry[key]) {
      delete _registry[key][exSession.getSessionId()];
    }
  }

});
