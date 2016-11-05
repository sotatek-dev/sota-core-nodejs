var BaseController  = require('./BaseController');
var passport        = require('passport');
var jwt             = require('jwt-simple');

module.exports = BaseController.extend({
  classname: 'UserController',

  login: function(req, res) {
    var redirectUrl = '/';
    if (req.params && req.params['redirect_url']) {
      redirectUrl = req.params['redirect_url'];
    }

    passport.authenticate('local', {
      successRedirect   : redirectUrl,
      failureRedirect   : '/login',
      failureFlash      : true,
    }, function(err, user, info) {
      logger.info('login err=' + util.inspect(err));
      logger.info('login user=' + util.inspect(user));
      logger.info('login info=' + util.inspect(info));

      if (err) {
        return res.sendError(err);
      }

      if (user === false) {
        if (info && info.message) {
          return res.sendError(info.message);
        }

        res.sendError(info);
      }

      var expires = moment().add(7, 'days').valueOf(),
          secret = process.env.SECRET;

      var token = jwt.encode({
        userId: user.id,
        email: user.email,
        exp: expires
      }, secret);

      res.ok(user.setExtra({
        token: token
      }));

    })(req, res);
  },

  logout: function(req, res) {
    res.ok();
  },

});
