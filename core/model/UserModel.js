var bcrypt        = require('bcryptjs');
var UserEntity    = require('../entity/UserEntity');

module.exports = BaseModel.extend({
  classname : 'UserModel',

  $tableName: 'user',
  $Entity: UserEntity,
  $columns: {
    'user_name'   : {type: 'number', size: 10 , version: 1, active: true, isNotNull: false},
    'first_name'  : {type: 'number', size: 10 , version: 1, active: true, isNotNull: false},
    'last_name'   : {type: 'number', size: 10 , version: 1, active: true, isNotNull: false},
    'last_name'   : {type: 'string', size: 128, version: 1, active: true, isNotNull: false},
    'email'       : {type: 'string', size: 128, version: 1, active: true, isNotNull: false},
    'password'    : {type: 'number', size: 10 , version: 1, active: true, isNotNull: false},
    'salt'        : {type: 'number', size: 10 , version: 1, active: true, isNotNull: false},
  },

  $indexes: {
    'user_name': ['user_name']
  },

  $uniques: {
    'user_name': ['user_name']
  },

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
