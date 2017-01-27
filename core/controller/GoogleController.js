var BaseController  = require('./BaseController');

module.exports = BaseController.extends({
  classname: 'GoogleController',

  login: function(req, res) {
    var [err, params] = new Checkit({
      accessToken: ['required', 'string'],
      refreshToken: ['required', 'string'],
    }).validateSync(req.allParams);

    if (err) {
      return res.badRequest(err.toString());
    }

    var AuthService = req.getService('AuthService');
    AuthService.getUserGoogle(
      params.accessToken, params.refreshToken,
      this.ok.bind(this, req, res)
    );
  },

  link: function(req, res) {
    var [err, params] = new Checkit({
      accessToken: ['required', 'string'],
      refreshToken: ['required', 'string'],
    }).validateSync(req.allParams);

    if (err) {
      return res.badRequest(err.toString());
    }

    var GoogleService = req.getService('GoogleService');
    GoogleService.linkUserByToken(
      req.user.id, params.accessToken, params.refreshToken,
      this.created.bind(this, req, res)
    );
  },

  unlink: function(req, res) {
    var userId = req.user.id;

    var GoogleService = req.getModel('GoogleService');
    GoogleService.unlink(userId, this.deleted.bind(this, req, res));
  },

});
