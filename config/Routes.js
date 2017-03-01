module.exports = {

  GET: {
    '/': ['MainController.mainPage'],
    '/profile': ['MainController.profilePage', ['authenticate']]
  },

  POST: {
    '/register': ['MainController.register']
  }

}
