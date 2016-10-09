var BaseClass = require('../../common/BaseClass');

var MockFactory = BaseClass.singleton({
  classname : 'MockFactory',

  _registers : {},

  register : function(mockData) {
    if (mockData.tableName) {
      this._registers[mockData.tableName] = mockData;
    }
  },

  get : function(tableName) {
    var mockData = this._registers[tableName];
    if (!mockData) {
      logger.error('MockFactory::get mock of (' +
                  tableName + ') is not registered yet...');
    }

    return mockData;
  },

});

module.exports = MockFactory;
