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
formidable          = require('formidable');
imagemin            = require('imagemin');
imageminMozjpeg     = require('imagemin-mozjpeg');
imageminPngquant    = require('imagemin-pngquant');

// TODO: remove global scope of logger
logger              = log4js.getLogger('SotaServer');

LocalCache          = require('./common/LocalCache');
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
AdapterFactory      = require('./data/AdapterFactory');

/**
 * Hide real configuration object from rest of the world
 * No one should be able to touch it
 */
var _realConfig = {};

var SotaServer = BaseClass.extend({
  classname : 'SotaServer',

  initialize: function(config) {
    // logger.info('SotaServer::initialize config=' + util.inspect(config));

    this._resolveConfig(config);
    this._initExpress();
    this._initServer();
    this._initPolicies();
    this._loadControllers();
    this._loadModels();
    this._loadServices();
    this._setupCheckit();
    this._setupPassport();
    this._setupRoutes();
    this._initSocket();
  },

  _resolveConfig: function(config) {
    /**
     * rootDir is absolute path to the application's directory
     */
    let rootDir = path.join(path.resolve('.'));
    _realConfig.rootDir = rootDir;

    /**
     * Local configuration
     */
    let localConfig = {},
        localConfigFile = path.join(rootDir, 'config', 'Local.js');
    if (FileUtils.isFileSync(localConfigFile)) {
      localConfig = require(localConfigFile);
    }

    /**
     * publicDir should be the folder contains static files
     */
     _realConfig.publicDir = path.join(rootDir, 'public');

     /**
     * viewDir should be the folder contains view templates
     */
     _realConfig.viewDir = path.join(rootDir, 'views');

    /**
     * Port and secret phrase for encryption
     * Normally are defined in .env file
     */
    _realConfig.port = process.env.PORT;
    _realConfig.secret = process.env.SECRET;

    /**
     * Routes
     */
    let routeConfigFile = path.resolve(rootDir, 'config', 'Routes.js');
    if (!FileUtils.isFileSync(routeConfigFile)) {
      throw new Error('Routes configuration file does not exist: ' + routeConfigFile);
    }
    _realConfig.routes = require(routeConfigFile);

    /**
     * Policies are stored in:
     * - core/policy/     (core-level)
     * - app/policies/    (app-level)
     */
    let policyDirs = [];
    policyDirs.push(path.resolve(rootDir, 'core', 'policy'));
    policyDirs.push(path.resolve(rootDir, 'app', 'policies'));
    _realConfig.policyDirs = policyDirs;

    /**
     * There's no specific controller in core-level
     * The folder normally contains controllers is
     * - app/controllers/
     */
    let controllerDirs = [];
    controllerDirs.push(path.resolve(rootDir, 'app', 'controllers'));
    _realConfig.controllerDirs = controllerDirs;

    /**
     * There're some models are predefined in core (like UserModel)
     * Others will be made or overrided for particular application's business
     * All model classes in those directory will be loaded:
     * - core/model/
     * - app/models/
     */
    let modelDirs = [];
    modelDirs.push(path.resolve(rootDir, 'core', 'model'));
    modelDirs.push(path.resolve(rootDir, 'app', 'models'));
    _realConfig.modelDirs = modelDirs;

    /**
     * ModelSchema is auto-generated file, reflects the database structure
     */
    modelSchema = require(path.resolve(rootDir, 'config', 'ModelSchema'));
    _realConfig.modelSchema = modelSchema;

    /**
     * Services are just similar to models
     * - core/service/
     * - app/services/
     */
    let serviceDirs = [];
    serviceDirs.push(path.resolve(rootDir, 'core', 'service'));
    serviceDirs.push(path.resolve(rootDir, 'app', 'services'));
    _realConfig.serviceDirs = serviceDirs;

    /**
     * Rules to check and get parameters
     */
    let checkitDirs = [];
    checkitDirs.push(path.resolve(rootDir, 'app', 'checkits'));
    _realConfig.checkitDirs = checkitDirs;

    /**
     * Sockets:
     * - app/sockets/
     */
    let socketDirs = [];
    socketDirs.push(path.resolve(rootDir, 'app', 'sockets'));
    _realConfig.socketDirs = socketDirs;

    /**
     * Application's defined constants
     */
    let constConfigFile = path.resolve(rootDir, 'app', 'common', 'Const.js');
    if (FileUtils.isFileSync(constConfigFile)) {
      _realConfig.const = require(constConfigFile);
    }

     /**
      * Adapter settings
      */
    _realConfig.adapters = _.merge(
      require(path.resolve(rootDir, 'config', 'Adapters')),
      localConfig.adapters
    );

    /**
     * All settings can be overrided via the passed argument here
     */
    if (config) {
      _realConfig = _.merge(_realConfig, config);
    }

    /**
     * Extend the core's constants by the app's ones
     */
    Const = _.merge(Const, _realConfig.const || {});

  },

  _initExpress: function() {
    logger.info('SotaServer::_initExpress initializing express application...');
    var app = express();

    // Customized config
    app.set('jwtSecret', _realConfig.secret);
    app.set('jwtBodyField', _realConfig.jwtBodyField || 'auth_token');
    app.set('rootDir', _realConfig.rootDir);

    // Express config
    app.set('port', _realConfig.port);
    app.set('views', _realConfig.viewDir);
    app.set('view engine', _realConfig.viewExtension || 'hbs');
    app.engine('html', _realConfig.viewEngine || require('hbs').__express);

    // Middlewares setup
    // TODO: make this more configurable
    let sessionOpts = {
      secret: _realConfig.secret,
      resave: true,
      saveUninitialized: true,
    };
    app.use(morgan('dev'));
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(session(sessionOpts));
    app.use(express.static(_realConfig.publicDir));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(flash());

    // Expose the express app locally
    this.myApp = app;

    // TODO: Handle process-level events
    process.on('uncaughtException', function (err) {
      logger.error('############## process begin uncaught exception info ##############');
      logger.error(err);
      logger.error('############## process  end  uncaught exception info ##############');
    });
  },

  _initServer: function() {
    this.myServer = http.createServer(this.myApp);
  },

  startServer: function() {
    this.myServer.listen(_realConfig.port, this.onServerCreated.bind(this));
    this.myServer.on('error', this.onError.bind(this));
    this.myServer.on('listening', this.onListening.bind(this));
  },

  _initSocket: function() {
    var init = require('./initializer/Socket'),
        socketDirs = _realConfig.socketDirs;

    init(this.myApp, this.myServer, socketDirs);
  },

  _initPolicies: function() {
    var init = require('./initializer/Policy'),
        policyDirs = _realConfig.policyDirs;

    init(this.myApp, PolicyManager, policyDirs);
  },

  _loadControllers: function() {
    var init = require('./initializer/Controller'),
        controllerDirs = _realConfig.controllerDirs;

    init(this.myApp, ControllerFactory, controllerDirs);
  },

  _loadModels: function() {
    var init = require('./initializer/Model'),
        adapters = _realConfig.adapters,
        schema = _realConfig.modelSchema,
        modelDirs = _realConfig.modelDirs;

    init(this.myApp, ModelFactory, adapters, schema, modelDirs);
  },

  _loadServices: function() {
    var init = require('./initializer/Service'),
        serviceDirs = _realConfig.serviceDirs;
    init(this.myApp, ServiceFactory, serviceDirs);
  },

  _setupCheckit: function() {
    var init = require('./initializer/Checkit'),
        checkitDirs = _realConfig.checkitDirs;
    init(Checkit, checkitDirs);
  },

  _setupPassport: function() {
    var init = require('./initializer/Passport');
    init(this.myApp, passport);
  },

  _setupRoutes: function() {
    var init = require('./initializer/Routes');
    init(this.myApp, ControllerFactory, _realConfig);
  },

  onServerCreated: function() {
    logger.info('Creating http server. Listening on port: ' + _realConfig.port);
  },

  onListening: function() {
    logger.info('SotaServer is on listening');
  },

  onError: function(e) {
    logger.error('############## SotaServer begin onError info ##############');
    logger.error('onError: ' + util.inspect(e));
    logger.error('############## SotaServer  end  onError info ##############');
  },

});

module.exports = SotaServer;
