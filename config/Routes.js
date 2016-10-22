var MainController        = require('../app/controllers/MainController');
var RegisterController    = require('../app/controllers/RegisterController');
var LoginController       = require('../app/controllers/LoginController');
var UserController        = require('../app/controllers/UserController');

module.exports = {

  GET : {
    '/'                 : MainController.handleBy('mainPage'),
    '/register'         : RegisterController.handleBy('mainPage'),
    '/login'            : LoginController.handleBy('mainPage'),
    '/profile'          : UserController.createAuth('profilePage', ['authenticate']),
  },

  POST : {
    '/register'         : RegisterController.handleBy('register'),
  }

};