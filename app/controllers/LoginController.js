var BaseController = require('../../core/controller/BaseController');

module.exports = BaseController.extend({
  classname : 'LoginController',

  initialize : function() {
    logger.info('LoginController::initialize');
  },

  mainPage : function(req, res) {
    if (req.session && req.session.user) {
      res.send('Login already...');
      return;
    }

    res.render('login', {
      title     : 'Login',
      message   : '',
    });
  },

});
