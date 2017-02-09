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

      if (!ret) {
        return callback(null, 1);
      }

      callback(null, parseInt(ret.value));
    });
  },

});
