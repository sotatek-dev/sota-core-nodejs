var BaseController    = require('../../core/controller/BaseController');

module.exports = BaseController.extend({
  classname : 'HelloWorldController',

  initialize : function() {
    logger.info('HelloWorldController::initialize');
  },

  helloWorldNoAuth : function(req, res) {

    UserStatusModel = req.getModel('UserStatusModel');

    async.auto({
      hello : function(next) {
        next(null, 'hello');
      },
      getAllUserStatus : ['hello', function(ret, next) {
        UserStatusModel.testSelectAll(next);
      }],
      getOneUserStatus : ['hello', function(ret, next) {
        UserStatusModel.testSelectOne(next);
      }],
    }, function(err, ret) {
      if (err) {
        res.send(err);
        return;
      }

      res.send({
        status  : 0,
        msg   : 'helloWorldNoAuth OK.',
        data  : {
          all : ret.getAllUserStatus,
          one : ret.getOneUserStatus,
        }
      });
    });
  },

  helloWorldWithAuth : function(req, res) {
    async.auto({
      hello : function(next) {
        next(null, null);
      }
    }, function(err, ret) {
      if (err) {
        res.sendError({});
        return;
      }

      res.send('helloWorldWithAuth OK.');
    });
  },

  insertUserStatus : function(req, res) {
    UserStatusModel = req.getModel('UserStatusModel');

    async.auto({
      hello : function(next) {
        next(null, 'hello');
      },
      insert : ['hello', function(ret, next) {
        UserStatusModel.insert([
          {id : 4, status : 'zzzzz'},
          {id : 5, status : 'zzzzy'},
        ], next);
      }],
    }, function(err, ret) {
      if (err) {
        res.send(err);
        return;
      }

      res.send({
        status  : 0,
        msg   : 'insertUserStatus OK.',
        data  : ret.insert
      });
    });
  },

  updateUserStatus : function(req, res) {
    UserStatusModel = req.getModel('UserStatusModel');

    async.auto({
      hello : function(next) {
        next(null, 'hello');
      },
      select : ['hello', function(ret, next) {
        UserStatusModel.selectOne({
          where : 'id=3'
        }, next);
      }],
      update : ['select', function(ret, next) {
        var entity = ret.select;
        entity.status = 'qwerty';
        UserStatusModel.updateOne(entity, next);
      }],
    }, function(err, ret) {
      if (err) {
        res.sendError(err);
        return;
      }

      res.send({
        status  : 0,
        msg   : 'updateUserStatus OK.',
        data  : ret.update.getData()
      });
    });
  },

  updateBatch : function(req, res) {
    UserStatusModel = req.getModel('UserStatusModel');

    async.auto({
      update : function(next) {
        UserStatusModel.update({
          set     : 'status = concat("test status ", `id`)',
          where   : 'id > 2',
          params  : [],
        }, next);
      },
    }, function(err, ret) {
      if (err) {
        res.send(err);
        return;
      }

      res.send({
        status  : 0,
        msg   : 'updateUserStatus OK.',
        data  : ret.update
      });
    });
  },

});
