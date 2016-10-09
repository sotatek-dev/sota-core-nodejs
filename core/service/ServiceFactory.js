var BaseClass = require('../common/BaseClass');

var ServiceFactory = BaseClass.singleton({
  classname : 'ServiceFactory',

  _registers : {},

  register : function(s) {
    logger.info('ServiceFactory::register ' + s.classname);
    if (s.classname) {
      this._registers[s.classname] = s;
    }
  },

  get : function(classname) {
    logger.info('ServiceFactory::get ' + classname);
    return this._registers[classname];
  },

});

module.exports = ServiceFactory;
