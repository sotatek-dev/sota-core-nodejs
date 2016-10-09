var BaseModel         = require('./BaseModel');

var UserSessionModel = BaseModel.extend({
  classname   : 'UserSessionModel',

  $tableName : 'user_session',
  dsConfig   : {
    read  : 'mysql-slave',
    write : 'mysql-master',
  },

});

module.exports = UserSessionModel;
