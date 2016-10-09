var Const = require('../core/common/Const');

module.exports = {
  port      : 8989,
  debug     : true,
  secret    : '123456',
  adapters  : {
    'mysql-master' : {
      key     : 'mysql-master',
      type    : Const.DATA_SOURCE_TYPE.MYSQL,
      dbName  : 'test-sota-fw',
      dbUser  : 'test-sota-fw',
      dbPwd   : '1',
      dbHost  : '127.0.0.1',
    },
    'mysql-slave' : {
      key     : 'mysql-slave',
      type    : Const.DATA_SOURCE_TYPE.MYSQL,
      dbName  : 'test-sota-fw',
      dbUser  : 'test-sota-fw',
      dbPwd   : '1',
      dbHost  : '127.0.0.1',
    },
  }
};