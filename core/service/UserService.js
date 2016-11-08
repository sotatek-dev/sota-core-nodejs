var UserService = BaseService.extends({
  classname : 'UserService',

  register : function(userInfo, callback) {
    var self = this,
        UserModel = self.getModel('UserModel');

    var identifyCols = ['id', 'email'],
        colName,
        colValue;

    for (var i = 0; i < identifyCols.length; i++) {
      colName = identifyCols[i];
      colValue = userInfo[colName];
      if (colValue) {
        break;
      }
    }

    if (!colValue) {
      callback(ErrorFactory.badRequest('No lookup information.'));
      return;
    }

    async.auto({
      find: function(next) {
        UserModel.findOne({
          where   : colName + '=?',
          params  : [colValue],
        }, next);
      },
      register: ['find', function(ret, next) {
        if (!!ret.find) {
          next(ErrorFactory.conflict('Email already taken.'));
          return;
        }

        UserModel.add(userInfo, next);
      }],
    }, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, ret.register);

    });
  },

  getList : function(callback) {
    var self = this;
    var UserModel = self.getModel('UserModel');

    async.auto({
      list : function(next) {
        UserModel.find({
          where : '1=1'
        }, next);
      },
    }, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, ret.list);
    });
  },

  insertRandom : function(callback) {
    var self = this;
    var UserModel = self.getModel('UserModel');

    async.auto({
      getLast : function(next) {
        UserModel.selectOne({
          orderBy : 'id desc'
        }, next);
      },
      insertNext : ['getLast', function(ret, next) {
        var lastUserId = ret.getLast ? ret.getLast.id : 0;
        var nextUserId = lastUserId + 1;
        UserModel.insert({
          username    : 'user' + nextUserId,
          first_name  : 'First ' + nextUserId,
          last_name   : 'Last ' + nextUserId,
        }, next);
      }],
    }, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, ret.insertNext);

    });
  },

  delete : function(userId, callback) {
    var self = this;
    var UserModel = self.getModel('UserModel');

    UserModel.delete({
      where : 'id=' + userId,
    }, callback);
  },

  updateOne : function(userId, data, callback) {
    var self = this;
    var UserModel = self.getModel('UserModel');
    var entity;

    async.auto({
      getOne : function(next) {
        UserModel.selectOne({
          where : 'id=' + userId
        }, next);
      },
      update : ['getOne', function(ret, next) {
        entity = ret.getOne;
        for (var p in data) {
          entity[p] = data[p];
        }
        entity.save(next);
      }],
    }, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, ret.update);
    });
  },

});

module.exports = UserService;
