var SotaServer  = require('../../SotaServer');
var BaseModel   = require('../../model/BaseModel');
var Config      = require('../../../config/Config');

var XModel = BaseModel.extend({
  classname : 'XModel',

  $columns : {
    'token'       : {type: 'number', size: 10, version: 1, active: true, isNotNull: true},
    'last_login'  : {type: 'number', size: 10, version: 1, active: true, isNotNull: true},
  },

  dsConfig     : {
    read  : 'mysql-master',
    write : 'mysql-slave',
  },

});

var assert = require('assert');
describe('BaseModel', function() {

  describe('#getAttributeNames', function() {
    it('should return atrributes\' name in model', function() {
      var x = new XModel(null, Config.adapters);
      var cols = x.getAttributeNames();
      assert.equal(cols.length, 7);
      assert.equal(cols[0], 'id');
      assert.equal(cols[1], 'token');
      assert.equal(cols[2], 'lastLogin');
      assert.equal(cols[3], 'createdAt');
      assert.equal(cols[4], 'updatedAt');
      assert.equal(cols[5], 'createdBy');
      assert.equal(cols[6], 'updatedBy');
    });
  });

  describe('#getColumnNames', function() {
    it('should return columns\' name in model', function() {
      var x = new XModel(null, Config.adapters);
      var cols = x.getColumnNames();
      assert.equal(cols.length, 7);
      assert.equal(cols[0], 'id');
      assert.equal(cols[1], 'token');
      assert.equal(cols[2], 'last_login');
      assert.equal(cols[3], 'created_at');
      assert.equal(cols[4], 'updated_at');
      assert.equal(cols[5], 'created_by');
      assert.equal(cols[6], 'updated_by');
    });
  });
});
