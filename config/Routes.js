var Filter                = require('../core/controller/Filter');
var MainController        = require('../app/controllers/MainController');
var RegisterController    = require('../app/controllers/RegisterController');
var LoginController       = require('../app/controllers/LoginController');
var UserController        = require('../app/controllers/UserController');

module.exports = {

  GET : {
    '/'                 : MainController.createNoCheck('mainPage'),
    '/register'         : RegisterController.createNoCheck('mainPage'),
    '/login'            : LoginController.createNoCheck('mainPage'),
    '/profile'          : UserController.createAuth('profilePage'),
  },

  POST : {
    '/register'         : RegisterController.createNoCheck('register'),
  }

};