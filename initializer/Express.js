const hbs = require('hbs');

module.exports = function (config) {
  var app = require('express')();

  // Customized config
  app.set('jwtSecret', config.secret || process.env.SECRET);
  app.set('jwtBodyField', config.jwtBodyField || 'auth_token');
  app.set('rootDir', config.rootDir);

  // Express config
  app.set('port', config.port || process.env.PORT);
  app.set('views', config.viewDir);
  app.set('view engine', config.viewExtension || 'hbs');
  app.engine('html', config.viewEngine || hbs.__express);

  return app;
};
