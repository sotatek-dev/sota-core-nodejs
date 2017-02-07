var BaseModel = require('../../core/model/BaseModel');

module.exports = BaseModel.extends({
  classname : 'ConfigModel',

  $tableName: 'config',
  $dsConfig: {
    read   : 'mysql-slave',
    write  : 'mysql-master',
  },

  getValue: function(key, callback) {
    this.findOne({
      where: '`key`=?',
      params: [key],
    }, function(err, ret) {
      if (err) {
        return callback(err);
      }

      if (_.isNil(ret)) {
        return callback(null, null);
      }

      var value = ret.value;
      if (ret.type === 'integer') {
        value = parseInt(value);
      } else if (ret.type === 'float') {
        value = parseFloat(value);
      }

      callback(null, value);
    });
  }

});
