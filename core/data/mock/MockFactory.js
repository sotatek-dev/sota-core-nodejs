/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var Class   = require('sota-class').Class
var logger  = log4js.getLogger('MockFactory')

var MockFactory = Class.singleton({
  classname: 'MockFactory',

  _registers: {},

  register: function (mockData) {
    if (mockData.tableName) {
      this._registers[mockData.tableName] = mockData
    }
  },

  get: function (tableName) {
    var mockData = this._registers[tableName]
    if (!mockData) {
      logger.error('MockFactory::get mock of (' +
                  tableName + ') is not registered yet...')
    }

    return mockData
  }

})

module.exports = MockFactory
