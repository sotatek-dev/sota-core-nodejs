var SotaServer  = require('../../SotaServer');
var assert    = require('assert');

describe('Utils', function() {
  describe('#capitalizeFirstLetter', function() {
    it('The word should be return with capitalized first letter', function() {
      var testStr1 = 'abcd';
      var testStr2 = 'abcD';
      assert.equal(Utils.capitalizeFirstLetter(testStr1), 'Abcd');
      assert.equal(Utils.capitalizeFirstLetter(testStr2), 'AbcD');
    });
  });

  describe('#convertToCamelCase', function() {
    it('convertToCamelCase', function() {
      var testStr1 = 'abc';
      var testStr2 = 'abc_xyz';
      var testStr3 = 'AbC_xYz';
      var testStr4 = 'ABC_XYZ';
      var testStr5 = 'IsGoogleConnected';
      var testStr6 = 'isGoogleConnected';
      assert.equal(Utils.convertToCamelCase(testStr1), 'abc');
      assert.equal(Utils.convertToCamelCase(testStr2), 'abcXyz');
      assert.equal(Utils.convertToCamelCase(testStr3), 'abcXyz');
      assert.equal(Utils.convertToCamelCase(testStr4), 'abcXyz');
      assert.equal(Utils.convertToCamelCase(testStr5), 'isGoogleConnected');
      assert.equal(Utils.convertToCamelCase(testStr6), 'isGoogleConnected');
    });
  });

  describe('#convertToSnakeCase', function() {
    it('convertToSnakeCase', function() {
      var testStr1 = 'abcXyz';
      var testStr2 = 'AbcXyZ';
      var testStr3 = 'abcXYZ';
      var testStr4 = 'Abc_Xyz';
      assert.equal(Utils.convertToSnakeCase(testStr1), 'abc_xyz');
      assert.equal(Utils.convertToSnakeCase(testStr2), 'abc_xy_z');
      assert.equal(Utils.convertToSnakeCase(testStr3), 'abc_xyz');
      assert.equal(Utils.convertToSnakeCase(testStr4), 'abc_xyz');
    });
  });

  describe('#emailUsername', function() {
    it('emailUsername', function() {
      var testStr1 = 'abc@xyz.w';
      var testStr2 = 'abc@xyz';
      var testStr3 = 'abc@';
      var testStr4 = '@xyz.w';
      assert.equal(Utils.emailUsername(testStr1), 'abc');
      assert.equal(Utils.emailUsername(testStr2), 'abc');
      assert.equal(Utils.emailUsername(testStr3), 'abc');
      assert.equal(Utils.emailUsername(testStr4), null);
    });
  });

  describe('#getRandomInRange', function() {
    it('getRandomInRange', function() {
      assert.ok(Utils.getRandomInRange(10, 20) >= 10);
      assert.ok(Utils.getRandomInRange(10, 20) <= 20);
      assert.ok(Utils.getRandomInRange(10, 10) == 10);
      assert.ok(Utils.getRandomInRange(20, 10) >= 10);
      assert.ok(Utils.getRandomInRange(20, 10) <= 20);
    });
  });

});