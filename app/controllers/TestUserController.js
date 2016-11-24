var BaseController = require('../../core/controller/BaseController');

module.exports = BaseController.extends({
  classname : 'TestUserController',

  initialize : function() {
    logger.trace('TestUserController::initialize');
  },

  mainPage : function(req, res) {
    res.render('test_user', {
      title : 'Test User Page'
    });
  },

  select : function(req, res) {
    var self = this;
    var UserService = req.getService('UserService');
    async.auto({
      list : function(next) {
        UserService.getList(next);
      }
    }, function(err, ret) {
      if (err) {
        res.sendError(err);
        return;
      }

      res.send({
        users: ret.list
      });
    });
  },

  insert : function(req, res) {
    var self = this;
    var UserService = req.getService('UserService');
    async.auto({
      insert : function(next) {
        UserService.insert({
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

  insertRandom : function(req, res) {
    var self = this;
    var UserService = req.getService('UserService');
    async.auto({
      insert : function(next) {
        UserService.insertRandom(next);
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
    var userId = req.allParams['user_id'];
    var self = this;
    var UserService = req.getService('UserService');
    async.auto({
      delete : function(next) {
        UserService.delete(userId, next);
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

  updateOne : function(req, res) {
    var userId = req.allParams['user_id'];
    var firstName = req.allParams['first_name'];
    var self = this;
    var UserService = req.getService('UserService');

    async.auto({
      updateOne : function(next) {
        UserService.updateOne(userId, {
          firstName   : firstName,
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
  }

});
