var AClass = require('./AClass');

var _secret = 'B-secret';

module.exports = AClass.singleton({
  classname: 'BClass',

  getSecret: function() {
    return _secret;
  },

  changeSecret: function(val) {
    _secret = val;
  },

});
