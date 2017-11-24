var BaseController = require('./BaseController');

module.exports = BaseController.extends({
  classname: 'FacebookController',

  login: function (req, res) {
    var [err, params] = new Checkit({
      fb_access_token: ['required', 'string']
    }).validateSync(req.allParams);

    if (err) {
      return res.unauthorized(err.toString());
    }

    var AuthService = req.getService('AuthService');
    AuthService.getUserFacebook(params.fb_access_token, this.ok.bind(this, req, res));
  },

  link: function (req, res) {
    var [err, params] = new Checkit({
      fb_access_token: ['required', 'string']
    }).validateSync(req.allParams);

    if (err) {
      return res.badRequest(err.toString());
    }

    var FacebookService = req.getService('FacebookService');
    FacebookService.linkUserByToken(
      req.user.id, params.fb_access_token,
      this.created.bind(this, req, res)
    );
  },

  unlink: function (req, res) {
    var userId = req.user.id;

    var FacebookService = req.getService('FacebookService');
    FacebookService.unlink(userId, this.deleted.bind(this, req, res));
  }

});
