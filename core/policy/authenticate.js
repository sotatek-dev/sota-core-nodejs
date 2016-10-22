module.exports = function(req, res, next) {
  passport.authenticate('jwt', {
    session: false
  }, function(err, user, info) {
    if (err) {
      next(err);
      return;
    }

    if (!user) {
      if (info && info.message) {
        return res.sendError(info.message);
      }

      res.sendError(info);
    }

    req.user = user;
    next();

  })(req, res, next);
};
