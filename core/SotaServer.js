fs                  = require('fs');
path                = require('path');
util                = require('util');
_                   = require('lodash');
async               = require('async');
moment              = require('moment');
Checkit             = require('checkit');
imagemin            = require('imagemin');
imageminMozjpeg     = require('imagemin-mozjpeg');
imageminPngquant    = require('imagemin-pngquant');

LocalCache          = require('./common/LocalCache');
Const               = require('./common/Const');
Class               = require('./common/Class');
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

// TODO: remove global scope of logger
logger          = require('log4js').getLogger('SotaServer');

/**
 * Hide real configuration object from rest of the world
 * No one should be able to touch it
 */
var _realConfig = {};

var SotaServer = Class.extends({
  classname : 'SotaServer',

  initialize: function(config) {
    // logger.info('SotaServer::initialize config=' + util.inspect(config));

    this._resolveConfig(config);
    this._initExpress();
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
     * Middlewares
     */
    let middlwareConfigFile = path.resolve(rootDir, 'config', 'Middlewares.js');
    if (FileUtils.isFileSync(middlwareConfigFile)) {
      _realConfig.middlewares = require(middlwareConfigFile);
    } else {
      _realConfig.middlewares = {};
    }

     let middlewareDirs = [];
     middlewareDirs.push(path.resolve(rootDir, 'core', 'middleware'));
     middlewareDirs.push(path.resolve(rootDir, 'app', 'middlewares'));
     _realConfig.middlewareDirs = middlewareDirs;

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
    var myApp = require('./initializer/Express')(_realConfig);
    var myServer = require('http').createServer(myApp);

    this._initMiddlewares(myApp);
    this._initPolicies(myApp);
    this._loadControllers(myApp);
    this._loadModels(myApp);
    this._loadServices(myApp);
    this._setupCheckit(myApp);
    this._setupPassport(myApp);
    this._setupRoutes(myApp);
    this._initSocket(myApp, myServer);

    this._setupProcess();

    process.nextTick(function() {
      myServer.listen(_realConfig.port, this.onServerCreated.bind(this));
      myServer.on('error', this.onError.bind(this));
      myServer.on('listening', this.onListening.bind(this));
    }.bind(this));
  },

  _initMiddlewares: function(myApp) {
    var init = require('./initializer/Middleware');
    init(myApp, _realConfig);
  },

  _initSocket: function(myApp, myServer) {
    var init = require('./initializer/Socket'),
        socketDirs = _realConfig.socketDirs;

    init(myApp, myServer, socketDirs);
  },

  _initPolicies: function(myApp) {
    var init = require('./initializer/Policy'),
        policyDirs = _realConfig.policyDirs;

    init(myApp, PolicyManager, policyDirs);
  },

  _loadControllers: function(myApp) {
    var init = require('./initializer/Controller'),
        controllerDirs = _realConfig.controllerDirs;

    init(myApp, ControllerFactory, controllerDirs);
  },

  _loadModels: function(myApp) {
    var init = require('./initializer/Model'),
        adapters = _realConfig.adapters,
        schema = _realConfig.modelSchema,
        modelDirs = _realConfig.modelDirs;

    init(myApp, ModelFactory, adapters, schema, modelDirs);
  },

  _loadServices: function(myApp) {
    var init = require('./initializer/Service'),
        serviceDirs = _realConfig.serviceDirs;
    init(myApp, ServiceFactory, serviceDirs);
  },

  _setupCheckit: function() {
    var init = require('./initializer/Checkit'),
        checkitDirs = _realConfig.checkitDirs;
    init(Checkit, checkitDirs);
  },

  _setupPassport: function(myApp) {
    var init = require('./initializer/Passport');
    init(myApp);
  },

  _setupRoutes: function(myApp) {
    var init = require('./initializer/Routes');
    init(myApp, ControllerFactory, _realConfig);
  },

  _setupProcess: function() {
    // TODO: Handle process-level events
    process.on('uncaughtException', function (err) {
      logger.error('############## process begin uncaught exception info ##############');
      logger.error(err);
      logger.error('############## process  end  uncaught exception info ##############');
    });
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
