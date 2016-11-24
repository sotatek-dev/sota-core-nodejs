var BaseController = require('../../core/controller/BaseController');

module.exports = BaseController.extends({
  classname : 'RegisterController',

  initialize : function() {
    logger.trace('RegisterController::initialize');
  },

  mainPage: function(req, res) {
    res.render('register', {
      title     : 'Register',
      message   : '',
    });
  },

  register: function(req, res) {
    var userInfo = {
      username  : req.allParams['email'],
      email     : req.allParams['email'],
      password  : req.allParams['password']
    };

    var UserService = req.getService('UserService');
    UserService.register(userInfo, function(err, ret) {
      if (err) {
        res.sendError(err);
        return;
      }

      res.send(ret);
    });
  },

});