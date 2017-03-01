/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var BaseController  = require('../../core/controller/BaseController')
var logger          = log4js.getLogger('LoginController')

module.exports = BaseController.extends({
  classname: 'LoginController',

  initialize: function () {
    logger.trace('LoginController::initialize')
  },

  mainPage: function (req, res) {
    if (req.session && req.session.user) {
      res.send('Login already...')
      return
    }

    res.render('login', {
      title: 'Login',
      message: ''
    })
  }

})
