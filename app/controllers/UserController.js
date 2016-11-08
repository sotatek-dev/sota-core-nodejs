var BaseController = require('../../core/controller/BaseController');

module.exports = BaseController.extends({
  classname : 'UserController',

  initialize : function() {
    logger.info('UserController::initialize');
  },

  profilePage : function(req, res) {
    var data = {
      title       : 'Profile',
      message     : 'Unauthorized',
      username    : null,
      isLoggedIn  : false
    };

    if (req.user) {
      data.message      = null;
      data.username     = req.user.username;
      data.isLoggedIn   = true;
    }

    res.render('profile', data);
  },

});
