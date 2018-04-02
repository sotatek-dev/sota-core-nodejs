var CachedEntity = require('./CachedEntity');
var bcrypt = require('bcryptjs');

module.exports = CachedEntity.extends({
  classname: 'UserEntity',

  isValidPassword: function (password) {
    return bcrypt.compareSync(password, this.password || '');
  },

  isValidEmail: function() {
    if (!this.email)
      return false;

    var regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return regex.test(email);
  }
});
