var SotaServer      = require('../../SotaServer');
var Class           = require('../../SotaApp').Class;
var assert          = require('assert');

var SuperClassTest = Class.extends({
  classname: 'SuperClassTest',

  initialize: function (prop) {
    this.testProp1 = 'SuperProp1';
    this.testProp2 = 'SuperProp2';

    this.prop = prop;
  }

});

var DerivedClassTest1 = SuperClassTest.extends({
  classname: 'DerivedClassTest',

  initialize: function () {
    this.testProp2 = 'Derived1Prop2';
  }

});

var DerivedClassTest2 = SuperClassTest.extends({
  classname: 'DerivedClassTest',

  initialize: function ($super, prop) {
    $super(prop);
    this.testProp2 = 'Derived2Prop2';
  }

});

var DerivedClassTest3 = SuperClassTest.extends({
  classname: 'DerivedClassTest',

  initialize: function ($super, prop) {
    this.testProp2 = 'Derived3Prop2';
    this.prop = prop;
  }

});

describe('Class', function () {

  describe('#initialize', function () {
    it('Classname', function () {
      var superObj = new SuperClassTest();
      assert.equal(superObj.classname, 'SuperClassTest');
    });
  });

  describe('#initialize', function () {
    it('Initialize', function () {
      var superObj    = new SuperClassTest();
      var derivedObj1 = new DerivedClassTest1();
      var derivedObj2 = new DerivedClassTest2('xxx');
      var derivedObj3 = new DerivedClassTest3('yyy');

      assert.equal(superObj.testProp1, 'SuperProp1');
      assert.equal(superObj.testProp2, 'SuperProp2');
      assert.equal(superObj.prop, undefined);

      assert.equal(derivedObj1.testProp1, 'SuperProp1');
      assert.equal(derivedObj1.testProp2, 'Derived1Prop2');
      assert.equal(derivedObj1.prop, undefined);

      assert.equal(derivedObj2.testProp1, 'SuperProp1');
      assert.equal(derivedObj2.testProp2, 'Derived2Prop2');
      assert.equal(derivedObj2.prop, 'xxx');

      assert.equal(derivedObj3.testProp1, undefined);
      assert.equal(derivedObj3.testProp2, 'Derived3Prop2');
      assert.equal(derivedObj3.prop, 'yyy');
    });
  });

  describe('#destroy', function () {
    it('Destroy', function () {

    });
  });
});
