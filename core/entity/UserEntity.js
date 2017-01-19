var CachedEntity  = require('./CachedEntity');
var bcrypt        = require('bcryptjs');

module.exports = CachedEntity.extends({
  classname: 'UserEntity',

  isValidPassword: function(password) {
    return bcrypt.compareSync(password, this.password || '');
  },

  toJSON: function($super) {
    this._data.fullName = (this._data.firstName || '') + ' ' + (this._data.lastName || '');
    return $super();
  },

});
