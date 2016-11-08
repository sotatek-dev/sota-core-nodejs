var Class = require('../../common/Class');

var _secret = 'A-secret';

module.exports = Class.extends({
  classname: 'AClass',

  getSecret: function() {
    return _secret;
  },

});
