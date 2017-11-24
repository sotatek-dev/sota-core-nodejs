var bcrypt = require('bcryptjs');
var UserEntity = require('../entity/UserEntity');
var CachedModel = require('./CachedModel');

module.exports = CachedModel.extends({
  classname: 'UserModel',

  $tableName: 'user',
  $Entity: UserEntity,

  $excludedCols: ['created_at', 'updated_at', 'created_by', 'updated_by', 'password'],

  $dsConfig: {
    read: 'mysql-slave',
    write: 'mysql-master'
  },

  generateHashedPassword: function(rawPassword) {
    return bcrypt.hashSync(rawPassword || '1', bcrypt.genSaltSync(8));
  },

  add: function ($super, data, options, callback) {
    var userInfo = data;
    var hashedPassword = this.generateHashedPassword(userInfo.password);
    userInfo.password = hashedPassword;
    $super(data, options, callback);
  },

  updatePassword: function(userId, rawPassword, callback) {
    const hashedPassword = this.generateHashedPassword(rawPassword);
    this.update({
      set: 'password=?',
      where: 'id=?',
      params: [hashedPassword, userId]
    }, (err, ret) => {
      if (err) return callback(err);
      return callback(null, { success: 1 });
    });
  }

});
