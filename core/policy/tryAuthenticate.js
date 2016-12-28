var passport = require('passport');

module.exports = function(req, res, next) {
  passport.authenticate('jwt', {
    session: false
  }, function(err, user, info) {
    if (err) {
      next(err);
      return;
    }

    if (user && typeof user === 'object') {
      req.user = user;
    }

    next();

  })(req, res, next);
};
