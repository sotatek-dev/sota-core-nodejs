var SotaServer  = require('../../SotaServer');
var BaseModel   = require('../../model/BaseModel');
var Config      = require('../../../config/Config');
var ExSession   = require('../../common/ExSession');

var XModel = BaseModel.extends({
  classname : 'XModel',

  $columns : {
    'x_col'  : {type: 'number', size: 10, version: 1, active: true, isNotNull: true},
    'y_col'  : {type: 'number', size: 10, version: 1, active: true, isNotNull: true},
  },

  $dsConfig     : {
    read  : 'mysql-master',
    write : 'mysql-slave',
  },

});

var xMasterConfig = Config.adapters[XModel.dsConfig.write];
var xSlaveConfig = Config.adapters[XModel.dsConfig.read];

describe('BaseEntity', function() {
  describe('#setExtra', function() {
    it('Method setExtra shouldn\'t change id value', function() {
      var x = new XModel(new ExSession(), xMasterConfig, xSlaveConfig);
    });
  });
});