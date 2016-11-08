var BaseModel       = require('../../core/model/BaseModel');

module.exports = BaseModel.extends({
  classname : 'UserStatusModel',

  $tableName : 'user_status',

  dsConfig    : {
    read  : 'mysql-slave',
    write : 'mysql-master',
  },

  testSelectAll : function(callback) {
    var self = this;
    async.auto({
      select : function(next) {
        self.select({
          where : '1=1'
        }, next);
      },
    }, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      var entities = ret.select;
      var arrResult = [];
      _.each(entities, function(entity) {
        arrResult.push(entity.getData());
      });

      callback(err, arrResult);
    });
  },

  testSelectOne : function(callback) {
    var self = this;
    async.auto({
      select : function(next) {
        self.selectOne({
          where : '1=1'
        }, next);
      },
    }, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(err, ret.select.getData());
    });
  },

});