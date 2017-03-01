/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var util            = require('util')
var Class           = require('sota-class').Class
var MySQLAdapter    = require('./mysql/MySQLAdapter')
var MySQL           = require('mysql')
// var logger              = log4js.getLogger('AdapterFactory')

var _registry = {}
var _pools = {}

module.exports = Class.singleton({
  classname: 'AdapterFactory',

  create: function (exSession, config, mode) {
    if (!exSession || !exSession.getSessionId()) {
      throw new Error('AdapterFactory::create invalid config: config=' + util.inspect(config))
    }

    if (!config || !config.key) {
      throw new Error('AdapterFactory::create invalid config: config=' + util.inspect(config))
    }

    var type = config.type
    var key = config.key

    this._createPool(config)

    if (type === Const.DATA_SOURCE_TYPE.MYSQL) {
      return this._createMySQLAdapter(exSession, key, mode)
    } else {
      throw new Error('AdapterFactory::create unsupported type config=' + util.inspect(config))
    }
  },

  _createMySQLAdapter: function (exSession, key, mode) {
    if (!_registry[key]) {
      _registry[key] = {}
    }

    var sessionId = exSession.getSessionId()
    if (!_registry[key][sessionId]) {
      var adapter = new MySQLAdapter(exSession, _pools[key].instance, mode)
      _registry[key][sessionId] = adapter
    }

    return _registry[key][sessionId]
  },

  _createPool: function (config) {
    var type = config.type
    var key = config.key

    if (_pools[key]) {
      return
    }

    var pool
    var poolConfig = {
      host: config.dbHost,
      user: config.dbUser,
      password: config.dbPwd,
      database: config.dbName,
      connectionLimit: config.connectionLimit || 10,
      waitForConnections: config.waitForConnections || true,
      queueLimit: config.queueLimit || 5,
      charset: 'utf8mb4_general_ci'
    }

    if (type === Const.DATA_SOURCE_TYPE.MYSQL) {
      pool = MySQL.createPool(poolConfig)
    } else {
      throw new Error('AdapterFactory::_createPool unsupport type config=' + util.inspect(config))
    }

    _pools[key] = {}
    _pools[key].config = config
    _pools[key].instance = pool
  },

  unregister: function (exSession, key) {
    if (_registry[key]) {
      delete _registry[key][exSession.getSessionId()]
    }
  }

})
