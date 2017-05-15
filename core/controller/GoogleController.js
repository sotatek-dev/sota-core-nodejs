var BaseController = require('./BaseController')

module.exports = BaseController.extends({
  classname: 'GoogleController',

  login: function (req, res) {
    var [err, params] = new Checkit({
      authCode: ['string'],
      accessToken: ['string'],
      refreshToken: ['string']
    }).validateSync(req.allParams)

    if (err) {
      return res.badRequest(err.toString())
    }

    var AuthService = req.getService('AuthService')
    AuthService.getUserGoogle(params, this.ok.bind(this, req, res))
  },

  link: function (req, res) {
    var [err, params] = new Checkit({
      authCode: ['string'],
      accessToken: ['string'],
      refreshToken: ['string']
    }).validateSync(req.allParams)

    if (err) {
      return res.badRequest(err.toString())
    }

    var GoogleService = req.getService('GoogleService')
    GoogleService.linkUserByToken(req.user.id, params, this.created.bind(this, req, res))
  },

  unlink: function (req, res) {
    var userId = req.user.id

    var GoogleService = req.getService('GoogleService')
    GoogleService.unlink(userId, this.deleted.bind(this, req, res))
  }

})
