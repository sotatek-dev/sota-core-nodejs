var BaseController = require('../../core/controller/BaseController')

module.exports = BaseController.extends({
  classname: 'MainController',

  mainPage: function (req, res) {
    res.render('index', {
      title: 'Hello world'
    })
  },

  profilePage: function (req, res) {
    res.render('profile', {
      title: 'Hello world'
    })
  },

  register: function (req, res) {
    res.ok('OKKK')
  }

})
