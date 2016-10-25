var BaseClass = require('../../common/BaseClass');

var _secret = 'A-secret';

module.exports = BaseClass.extend({
  classname: 'AClass',

  getSecret: function() {
    return _secret;
  },

});
