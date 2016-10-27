module.exports = function(config) {
    var app = express();

    // Customized config
    app.set('jwtSecret', config.secret);
    app.set('jwtBodyField', config.jwtBodyField || 'auth_token');
    app.set('rootDir', config.rootDir);

    // Express config
    app.set('port', config.port);
    app.set('views', config.viewDir);
    app.set('view engine', config.viewExtension || 'hbs');
    app.engine('html', config.viewEngine || require('hbs').__express);

    return app;
};
