var BaseController = require('../../core/controller/BaseController');

module.exports = BaseController.extend({
  classname : 'UserController',

  initialize : function() {
    logger.info('UserController::initialize');
  },

  profilePage : function(req, res) {
    var data = {
      title       : 'Profile',
      message     : 'Unauthorized',
      userName    : null,
      isLoggedIn  : false
    };

    if (req.user) {
      data.message      = null;
      data.userName     = req.user.userName;
      data.isLoggedIn   = true;
    }

    res.render('profile', data);
  },

});
