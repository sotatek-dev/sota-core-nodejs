var BaseController  = require('./BaseController');
var passport        = require('passport');

module.exports = BaseController.extends({
  classname: 'TwitterController',

  login: function(req, res) {
    var [err, params] = new Checkit({
      tokenKey: ['required', 'string'],
      tokenSecret: ['required', 'string'],
    }).validateSync(req.allParams);

    if (err) {
      return res.unauthorized(err.toString());
    }

    var AuthService = req.getService('AuthService');
    AuthService.getUserTwitter(params.tokenKey, params.tokenSecret, this.ok.bind(this, req, res));
  },

  link: function(req, res) {
    var [err, params] = new Checkit({
      tokenKey: ['required', 'string'],
      tokenSecret: ['required', 'string'],
    }).validateSync(req.allParams);

    if (err) {
      return res.badRequest(err.toString());
    }

    var TwitterService = req.getService('TwitterService');
    TwitterService.linkUserByToken(
      req.user.id, params.tokenKey, params.tokenSecret,
      this.created.bind(this, req, res)
    );
  },

  unlink: function(req, res) {
    var userId = req.user.id;

    var TwitterService = req.getService('TwitterService');
    TwitterService.unlink(userId, this.deleted.bind(this, req, res));
  },

  login2: function(req, res, next) {
    passport.authenticate('twitter')(req, res, next);
  },

  login2CB: function(req, res) {
    var self = this;
    var AuthService = req.getService('AuthService');

    passport.authenticate('twitter', {
      failureRedirect: '/login'
    }, function(err, data, info) {
      if (err) {
        return res.sendError(err);
      }

      if (data === false) {
        if (info && info.message) {
          return res.sendError(info.message);
        }

        return res.sendError(info);
      }

      AuthService.getUserTwitter2(data.profile, self.ok.bind(self, req, res));
    })(req, res);
  },

});
