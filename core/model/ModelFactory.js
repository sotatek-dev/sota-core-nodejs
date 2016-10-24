var BaseClass = require('../common/BaseClass');
var logger = log4js.getLogger('ModelFactory');

var ModelFactory = BaseClass.singleton({
  classname : 'ModelFactory',

  _registers : {},

  setAdaptersConfig: function(adaptersConfig) {
    this._adaptersConfig = adaptersConfig;
  },

  setModelSchema: function(modelSchema) {
    this._modelSchema = modelSchema;
  },

  getAdapterConfig: function(key) {
    var config = this._adaptersConfig[key];
    if (!config) {
      throw new Error('Cannot find adapter config for key: ' + key);
    }
    return config;
  },

  register : function(m) {
    logger.info(this.classname + '::register ' + m.classname);

    if (!m.classname) {
      logger.error('No classname, invalid model: ' + util.inspect(m));
      return;
    }

    if (!m.tableName) {
      logger.error('No table name, invalid model: ' + m.classname);
      return;
    }

    // Inject columns property from auto-generated object into model class
    var columns = this._modelSchema[m.classname];
    m.prototype.columns = m.columns = columns;

    this._registers[m.classname] = m;
  },

  get : function(classname) {
    logger.info(this.classname + '::get ' + classname);
    return this._registers[classname];
  },

  getAll: function() {
    return _.keys(this._registers);
  },

  create: function(classname, exSession, dsConfig) {
    if (this._registers[classname]) {
      return new this._registers[classname](exSession, dsConfig);
    }
  },

});

module.exports = ModelFactory;
