module.exports = function (app, config) {
  if (config.usePassport === false) {
    return null;
  }

  var passport = require('passport');
  return passport.initialize();
};
