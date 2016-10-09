var BaseController = require('../../core/controller/BaseController');

module.exports = BaseController.extend({
  classname : 'MainController',

  initialize : function() {
    logger.info('MainController::initialize');
  },

  mainPage : function(req, res) {

    res.render('index', {
      title : 'Hello world'
    });
  },

});