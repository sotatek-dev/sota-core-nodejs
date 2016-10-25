var BaseEntity  = require('./BaseEntity');
var bcrypt      = require('bcryptjs');

module.exports = BaseEntity.extend({
  classname: 'UserEntity',

  isValidPassword: function(password) {
    return bcrypt.compareSync(password, this.password || '');
  },

});
