var BaseController = require('../../core/controller/BaseController');

module.exports = BaseController.extends({
  classname : 'MainController',

  initialize : function() {
    logger.trace('MainController::initialize');
  },

  mainPage : function(req, res) {

    res.render('index', {
      title : 'Hello world'
    });
  },

});