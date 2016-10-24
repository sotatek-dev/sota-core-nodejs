http                = require('http');
express             = require('express');
morgan              = require('morgan');
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
log4js              = require('log4js');
Checkit             = require('checkit');

// TODO: remove global scope of logger
logger              = log4js.getLogger('SotaServer');

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
PolicyManager       = require('./policy/PolicyManager');
ModelFactory        = require('./model/ModelFactory');
ServiceFactory      = require('./service/ServiceFactory');

var SotaServer = BaseClass.extend({
  classname : 'SotaServer',

  initialize : function(config) {
    // logger.info('SotaServer::initialize config=' + util.inspect(config));
    this._config = config;

    this._initApp();
    this._initServer();
    this._extendConstants();
    this._initPolicies();
    this._loadControllers();
    this._loadModels();
    this._loadServices();
    this._setupCheckit();
    this._setupPassport();
    this._setupRoutes();
    this._initSocket();
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
    app.set('rootDir', this._config.rootDir || path.join(path.resolve('.')));

    app.set('port', this._config.port);
    app.set('views', this._config.viewDir);
    app.set('view engine', this._config.viewExtension || 'hbs');
    app.engine('html', this._config.viewEngine || require('hbs').__express);
    app.use(morgan('dev'));
    app.use(cookieParser());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(session(sessionOpts));
    app.use(express.static(this._config.publicDir));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    this.myApp = app;

    process.on('uncaughtException', function (err) {
      logger.error(err);
    });
  },

  _initServer : function() {
    this.myServer = http.createServer(this.myApp);
  },

  startServer: function() {
    var self = this;
    this.myServer.listen(this._config.port, function() {
      logger.info('Creating http server. Listening on port: ' + self._config.port);
    });
    this.myServer.on('error', this.onError.bind(this));
    this.myServer.on('listening', this.onListening.bind(this));
  },

  _extendConstants: function() {
    Const = _.merge({}, Const, this._config.const);
  },

  _initSocket: function() {
    var init = require('./initializer/Socket');
    init(this.myApp, this.myServer, this._config.socketDirs);
  },

  _initPolicies: function() {
    var init = require('./initializer/Policy');
    init(this.myApp, PolicyManager, this._config.policyDirs);
  },

  _loadControllers : function() {
    var init = require('./initializer/Controller');
    init(this.myApp, ControllerFactory, this._config.controllerDirs);
  },

  _loadModels : function() {
    var init = require('./initializer/Model');
    init(this.myApp,
      ModelFactory,
      this._config.adapters,
      this._config.modelSchema,
      this._config.modelDirs
    );
  },

  _loadServices : function() {
    var init = require('./initializer/Service');
    init(this.myApp, ServiceFactory, this._config.serviceDirs);
  },

  _setupCheckit: function() {
    var init = require('./initializer/Checkit');
    init(Checkit, this._config.checkitDirs);
  },

  _setupPassport : function() {
    var init = require('./initializer/Passport');
    init(this.myApp, passport);
  },

  _setupRoutes : function() {
    var init = require('./initializer/Routes');
    init(this.myApp, ControllerFactory, this._config);
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
