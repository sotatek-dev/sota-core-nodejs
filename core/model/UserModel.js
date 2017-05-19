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

  add: function ($super, data, options, callback) {
    var userInfo = data;
    var hashedPassword = bcrypt.hashSync(userInfo.password || '1', bcrypt.genSaltSync(8));
    userInfo.password = hashedPassword;
    $super(data, options, callback);
  }

});
