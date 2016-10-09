http                = require('http');
express             = require('express');
morgan              = require('morgan');
log4js              = require('log4js');
cookieParser        = require('cookie-parser');
cookieSession       = require('cookie-session');
session             = require('express-session');
bodyParser          = require('body-parser');
fs                  = require('fs');
path                = require('path');
util                = require('util');
_                   = require('lodash');
async               = require('async');
moment              = require('moment');
passport            = require('passport');
flash               = require('connect-flash');
jwt                 = require('jwt-simple');

logger              = log4js.getLogger();

Const               = require('./common/Const');
BaseClass           = require('./common/BaseClass');
FileUtils           = require('./util/FileUtils');
Utils               = require('./util/Utils');

BaseController      = require('./controller/BaseController');
BaseEntity          = require('./entity/BaseEntity');
BaseModel           = require('./model/BaseModel');
BaseService         = require('./service/BaseService');
ErrorFactory        = require('./error/ErrorFactory');
ControllerFactory   = require('./controller/ControllerFactory');
ModelFactory        = require('./model/ModelFactory');
ServiceFactory      = require('./service/ServiceFactory');

var SotaServer = BaseClass.extend({
  classname : 'SotaServer',

  initialize : function(config) {
    logger.info('SotaServer::initialize config=' + util.inspect(config));
    this._config = config;

    this._initApp();
    this._initServer();
    this._loadControllers();
    this._loadModels();
    this._loadServices();
    this._setupPassport();
    this._setupRoutes();
  },

  _initApp : function() {
    logger.info('SotaServer::_initApp initializing express application...');
    var app = express();

    var sessionOpts = {
      secret: this._config.secret,
      resave: true,
      saveUninitialized: true,
    };

    app.set('jwtSecret', this._config.secret);
    app.set('jwtBodyField', this._config.jwtBodyField || 'auth_token');

    app.set('port', this._config.port);
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', this._config.viewExtension || 'hbs');
    app.engine('html', this._config.viewEngine || require('hbs').__express);
    app.use(morgan('dev'));
    app.use(cookieParser());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(session(sessionOpts));
    app.use(express.static(path.join(__dirname, '../public')));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    this.myApp = app;

    process.on('uncaughtException', function (err) {
      logger.error(err);
    });
  },

  _initServer : function() {
    logger.info('SotaServer::_initServer creating http server. \
                Listening on port: ' + this._config.port);

    var server = http.createServer(this.myApp);
    server.listen(this._config.port);
    server.on('error', this.onError.bind(this));
    server.on('listening', this.onListening.bind(this));

    this.myServer   = server;
  },

  _loadControllers : function(controllerDir) {
    var init = require('./initializer/Controller');
    init(this.myApp, ControllerFactory, this._config.controllerDirs);
  },

  _loadModels : function() {
    var init = require('./initializer/Model');
    init(this.myApp, ModelFactory, this._config.modelDirs);
  },

  _loadServices : function() {
    var init = require('./initializer/Service');
    init(this.myApp, ServiceFactory, this._config.serviceDirs);
  },

  _setupPassport : function() {
    require('./initializer/Passport')(this.myApp, passport);
  },

  _setupRoutes : function() {
    require('./initializer/Routes')(this.myApp, this._config);
  },

  getAdapterConfig : function(key) {
    return this._config.adapters[key];
  },

  onListening : function() {
    logger.info('onListening');
  },

  onError : function(e) {
    logger.error('onError: ' + util.inspect(e));
  },
});

module.exports = SotaServer;
