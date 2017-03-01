var assert          = require('assert')
var SotaServer      = require('../../SotaServer')
var AClass          = require('../_dummy/AClass')
var BClass          = require('../_dummy/BClass')

describe('Singleton', function() {

  describe('#classname', function() {
    it('A-classname', function() {
      assert.equal(AClass.classname, 'AClass')
    })
    it('B-classname', function() {
      assert.equal(BClass.classname, 'BClass')
    })
  })

  describe('#secret', function() {
    it('A-secret', function() {
      var a = new AClass()
      assert.equal(a.getSecret(), 'A-secret')
    })
    it('B-secret', function() {
      assert.equal(BClass.getSecret(), 'B-secret')
      var changedSecret = 'zzzz'
      BClass.changeSecret(changedSecret)
      assert.equal(BClass.getSecret(), changedSecret)
      var x = BClass.getSecret()
      x = 'yyyy'
      assert.equal(BClass.getSecret(), changedSecret)
    })
  })

  describe('#destroy', function() {
    it('Destroy', function() {

    })
  })
})
