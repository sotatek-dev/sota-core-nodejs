module.exports = function(app, config) {
  var session = require('express-session');
  return session({
    secret: config.secret,
    resave: true,
    saveUninitialized: true,
  });
};
