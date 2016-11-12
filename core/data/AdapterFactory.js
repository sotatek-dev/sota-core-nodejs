var Class               = require('sota-class').Class;
var MySQLAdapter        = require('./mysql/MySQLAdapter');
var MySQL               = require('mysql');
var logger              = require('log4js').getLogger('AdapterFactory');

var _nextId = 0,
    _registry = {},
    _pools = {};

module.exports = Class.singleton({
  classname : 'AdapterFactory',

  create : function(exSession, config) {
    if (!config || !config.key) {
      logger.error('AdapterFactory::create invalid config: config=' + util.inspect(config));
      return null;
    }

    var type = config.type,
        key  = config.key;

    this._createPool(config);

    if (type === Const.DATA_SOURCE_TYPE.MYSQL) {
      return this._createMySQLAdapter(exSession, key);
    } else {
      logger.error('AdapterFactory::create unsupported type config=' + util.inspect(config));
      return null;
    }
  },

  _createMySQLAdapter : function(exSession, key) {
    var adapter = new MySQLAdapter(exSession, _pools[key].instance);
    _nextId++;
    _registry[_nextId] = adapter;
    adapter.registryId = _nextId;
    return adapter;
  },

  _createPool : function(config) {
    var type = config.type,
        key  = config.key;

    if (!!_pools[key]) {
      return;
    }

    var pool,
        poolConfig = {
          host                : config.dbHost,
          user                : config.dbUser,
          password            : config.dbPwd,
          database            : config.dbName,
          connectionLimit     : config.connectionLimit || 10,
          waitForConnections  : config.waitForConnections || true,
          queueLimit          : config.queueLimit || 5,
        };

    if (type === Const.DATA_SOURCE_TYPE.MYSQL) {
      pool = MySQL.createPool(poolConfig);
    } else {
      logger.error('AdapterFactory::_createPool unsupported type config=' + util.inspect(config));
      pool = null;
    }

    _pools[key] = {};
    _pools[key].config = config;
    _pools[key].instance = pool;
  },

});
