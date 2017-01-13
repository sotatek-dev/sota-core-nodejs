var bcrypt        = require('bcryptjs');
var UserEntity    = require('../entity/UserEntity');
var CachedModel   = require('./CachedModel');

module.exports = CachedModel.extends({
  classname : 'UserModel',

  $tableName: 'user',
  $Entity: UserEntity,

  $excludedCols: ['createdAt', 'updatedAt', 'createdBy', 'updatedBy',
                  'password', 'firstName', 'lastName'],

  dsConfig: {
    read   : 'mysql-slave',
    write  : 'mysql-master',
  },

  add: function($super, data, callback) {
    logger.debug('UserModel::add data=' + util.inspect(data));

    var userInfo = data;
    var hashedPassword = bcrypt.hashSync(userInfo.password || '', bcrypt.genSaltSync(8));
    userInfo.password = hashedPassword;
    $super(data, callback);
  },

});
