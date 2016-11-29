var BaseModel = require('./BaseModel');

module.exports = BaseModel.extends({
  classname : 'MasterModel',

  $tableName: 'master',
  $dsConfig: {
    read   : 'mysql-slave',
    write  : 'mysql-master',
  },

});
