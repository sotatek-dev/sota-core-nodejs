module.exports = function (app) {
  var session = require('express-session');
  return session({
    secret: process.env.SECRET,
    resave: true,
    saveUninitialized: true
  });
};
