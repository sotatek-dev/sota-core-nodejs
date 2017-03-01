var UserModel = require('../../core/model/UserModel')

module.exports = UserModel.extends({
  classname: 'UserModel',

  $dsConfig: {
    read: 'mysql-slave',
    write: 'mysql-master'
  }

})
