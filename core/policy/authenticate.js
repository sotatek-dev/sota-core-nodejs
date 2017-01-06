
module.exports = function(req, res, next) {
  if (!req.user) {
    return res.unauthorized('Unauthorized.');
  }

  next();
};
