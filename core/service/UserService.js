var BaseService     = require('./BaseService');

var UserService = BaseService.extends({
  classname : 'UserService',

  register : function(userInfo, callback) {
    var self = this;
    var UserModel = self.getModel('UserModel');

    var whereClauses = [];
    var params = [];
    var identifyCols = ['id', 'email'];

    for (var i = 0; i < identifyCols.length; i++) {
      var colName = identifyCols[i];
      var colValue = userInfo[colName];
      if (colValue) {
        whereClauses.push('`' + colName + '`=?');
        params.push(colValue);
      }
    }

    async.waterfall([
      function findUser(next) {
        if (whereClauses.length ===  0) {
          return next(null, null);
        }

        UserModel.findOne({
          where   : whereClauses.join(' OR '),
          params  : params,
        }, next);
      },
      function register(user, next) {
        if (user) {
          var errMsg = 'Conflict register information.';
          if (user.id === userInfo.id) {
            errMsg = 'User id was existed.';
          } else if (user.email === userInfo.email) {
            errMsg = 'Email has been taken.';
          }

          return next(ErrorFactory.conflict(errMsg));
        }

        UserModel.add(userInfo, next);
      },
    ], callback);
  },

});

module.exports = UserService;
