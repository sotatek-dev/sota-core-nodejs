// var logger = log4js.getLogger('PolicyCommit');

module.exports = function needCommit(req, res, next) {
  req._needCommit = true;
  next();
};
