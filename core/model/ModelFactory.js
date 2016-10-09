var BaseClass = require('../common/BaseClass');

var ModelFactory = BaseClass.singleton({
  classname : 'ModelFactory',

  _registers : {},

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
