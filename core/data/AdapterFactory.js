var BaseClass           = require('../common/BaseClass');
var MySQLAdapter        = require('./mysql/MySQLAdapter');
var MySQL               = require('mysql');

var AdapterFactory = BaseClass.singleton({
  classname : 'AdapterFactory',

  _nextId     : 0,
  _registry   : {},
  _pools      : {},

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
    var adapter = new MySQLAdapter(exSession, this._pools[key].instance);
    this._nextId++;
    this._registry[this._nextId] = adapter;
    adapter.registryId = this._nextId;
    return adapter;
  },

  _createPool : function(config) {
    var type = config.type,
        key  = config.key;

    if (!!this._pools[key]) {
      return;
    }

    var pool;

    if (type === Const.DATA_SOURCE_TYPE.MYSQL) {
      pool = MySQL.createPool({
        host      : config.dbHost,
        user      : config.dbUser,
        password  : config.dbPwd,
        database  : config.dbName,
      });
    } else {
      logger.error('AdapterFactory::_createPool unsupported type config=' + util.inspect(config));
      pool = null;
    }

    this._pools[key] = {};
    this._pools[key].config = config;
    this._pools[key].instance = pool;
  }

});

module.exports = AdapterFactory;
