var BaseController    = require('../../core/controller/BaseController');

module.exports = BaseController.extends({
  classname : 'TestUserStatusController',

  initialize : function() {
    logger.info('TestUserStatusController::initialize');
  },

  mainPage : function(req, res) {
    res.render('test_user_status', {
      title : 'Test User Status'
    });
  },

  select : function(req, res) {
    var UserStatusModel = req.getModel('UserStatusModel');
    async.auto({
      list : function(next) {
        UserStatusModel.testSelectAll(next);
      }
    }, function(err, ret) {
      if (err) {
        res.sendError(err);
        return;
      }

      res.send({
        userStatuses: ret.list
      });
    });
  },

  insert : function(req, res) {
    var UserStatusModel = req.getModel('UserStatusModel');
    async.auto({
      insert : function(next) {
        UserStatusModel.insert({
          status : 'Test new user status.'
        }, next);
      }
    }, function(err, ret) {
      if (err) {
        res.sendError(err);
        return;
      }

      res.send({
        userStatuses : ret.insert
      });
    });
  },

  delete : function(req, res) {
    var userId = req.body.userId;
    var UserStatusModel = req.getModel('UserStatusModel');
    async.auto({
      delete : function(next) {
        UserStatusModel.delete({
          where : 'user_id=' + userId
        }, next);
      }
    }, function(err, ret) {
      if (err) {
        res.sendError(err);
        return;
      }

      res.send({
        userStatuses: ret.delete
      });
    });
  },

});
