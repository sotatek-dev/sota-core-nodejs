var BaseModel = require('./BaseModel');

module.exports = BaseModel.extends({
  classname : 'MasterModel',

  $tableName: 'master',
  $dsConfig: {
    read   : 'mysql-slave',
    write  : 'mysql-master',
  },

  getDataVersion: function(callback) {
    var key = 'dataVersion';

    this.findOne({
      where: '`key`=?',
      params: [key],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }

      callback(null, parseInt(ret.value));
    });
  },

});
