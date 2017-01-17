fs                      = require('fs');
path                    = require('path');
util                    = require('util');
_                       = require('lodash');
co                      = require('co');
bb                      = require('bluebird');
async                   = require('async');
moment                  = require('moment');
Checkit                 = require('cc-checkit');
Class                   = require('sota-class').Class;
Interface               = require('sota-class').Interface;

CacheFactory            = require('./cache/foundation/CacheFactory');
LocalCache              = require('./cache/foundation/LocalCache');
RedisCache              = require('./cache/foundation/RedisCache');
Const                   = require('./common/Const');
FileUtils               = require('./util/FileUtils');
Utils                   = require('./util/Utils');

BaseController          = require('./controller/BaseController');
BaseEntity              = require('./entity/BaseEntity');
BaseModel               = require('./model/BaseModel');
BaseService             = require('./service/BaseService');
ErrorFactory            = require('./error/ErrorFactory');
ControllerFactory       = require('./controller/ControllerFactory');
PolicyManager           = require('./policy/PolicyManager');
ModelFactory            = require('./model/ModelFactory');
ServiceFactory          = require('./service/ServiceFactory');
AdapterFactory          = require('./data/AdapterFactory');
ExternalServiceAdapter  = require('./external_service/foundation/ExternalServiceAdapter');
getText                 = require('./factory/LocalizationFactory').getText;

// TODO: remove global scope of logger
logger              = require('log4js').getLogger('SotaServer');

/**
 * Hide real configuration object from rest of the world
 * No one should be able to touch it
 */
var _realConfig = {};
getModelSchema = function() {
  return _realConfig.modelSchema;
};

var SotaServer = Class.extends({
  classname : 'SotaServer',

  initialize: function(config) {
    // logger.trace('SotaServer::initialize config=' + util.inspect(config));

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

    let middlewareDirs = [],
       appMiddlewareDir = path.resolve(rootDir, 'app', 'middlewares');
    middlewareDirs.push(path.resolve(rootDir, 'core', 'middleware'));
    if (FileUtils.isDirectorySync(appMiddlewareDir)) {
      middlewareDirs.push(appMiddlewareDir);
    }
    _realConfig.middlewareDirs = middlewareDirs;

    /**
     * Localization
     */
    let localizationDirs = [],
        appLocalizationDir = path.resolve(rootDir, 'app', 'localizations');
    localizationDirs.push(path.resolve(rootDir, 'core', 'localization'));
    if (FileUtils.isDirectorySync(appLocalizationDir)) {
      localizationDirs.push(appLocalizationDir);
    }
    _realConfig.localizationDirs = localizationDirs;

    /**
     * Policies are stored in:
     * - core/policy/     (core-level)
     * - app/policies/    (app-level)
     */
    let policyDirs = [],
        appPolicyDir = path.resolve(rootDir, 'app', 'policies');
    policyDirs.push(path.resolve(rootDir, 'core', 'policy'));
    if (FileUtils.isDirectorySync(appPolicyDir)) {
      policyDirs.push(appPolicyDir);
    }
    _realConfig.policyDirs = policyDirs;

    /**
     * There's no specific controller in core-level
     * The folder normally contains controllers is
     * - app/controllers/
     */
    let controllerDirs = [],
        appControllerDir = path.resolve(rootDir, 'app', 'controllers');
    controllerDirs.push(path.resolve(rootDir, 'core', 'controller'));
    if (FileUtils.isDirectorySync(appControllerDir)) {
      controllerDirs.push(appControllerDir);
    }
    _realConfig.controllerDirs = controllerDirs;

    /**
     * There're some models are predefined in core (like UserModel)
     * Others will be made or overrided for particular application's business
     * All model classes in those directory will be loaded:
     * - core/model/
     * - app/models/
     */
    let modelDirs = [],
        appModelDir = path.resolve(rootDir, 'app', 'models');
    modelDirs.push(path.resolve(rootDir, 'core', 'model'));
    if (FileUtils.isDirectorySync(appModelDir)) {
      modelDirs.push(appModelDir);
    }
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
    let serviceDirs = [],
        appServiceDir = path.resolve(rootDir, 'app', 'services');
    serviceDirs.push(path.resolve(rootDir, 'core', 'service'));
    if (FileUtils.isDirectorySync(appServiceDir)) {
      serviceDirs.push(appServiceDir);
    }
    _realConfig.serviceDirs = serviceDirs;

    /**
     * Rules to check and get parameters
     */
    let checkitDirs = [],
        appCheckitDir = path.resolve(rootDir, 'app', 'checkits');
    if (FileUtils.isDirectorySync(appCheckitDir)) {
      checkitDirs.push(appCheckitDir);
    }
    _realConfig.checkitDirs = checkitDirs;

    /**
     * Cache functions
     */
    let cacheDirs = [],
        appCacheDir = path.resolve(rootDir, 'app', 'cache');
    cacheDirs.push(path.resolve(rootDir, 'core', 'cache'));
    if (FileUtils.isDirectorySync(appCacheDir)) {
      cacheDirs.push(appCacheDir);
    }
    _realConfig.cacheDirs = cacheDirs;

    /**
     * External service handlers
     */
    let externalServiceDirs = [],
        appExternalServiceDir = path.resolve(rootDir, 'app', 'external_services');
    if (FileUtils.isDirectorySync(appExternalServiceDir)) {
      externalServiceDirs.push(appExternalServiceDir);
    }
    _realConfig.externalServiceDirs = externalServiceDirs;

    /**
     * Sockets:
     * - app/sockets/
     */
    let socketDirs = [],
        appSocketDir = path.resolve(rootDir, 'app', 'sockets');
    if (FileUtils.isDirectorySync(appSocketDir)) {
      socketDirs.push(appSocketDir);
    }
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
      _.each(_.keys(config), function(p) {
        _realConfig[p] = config[p];
      });
    }

    /**
     * Extend the core's constants by the app's ones
     */
    Const = _.merge(Const, _realConfig.const || {});

  },

  _initExpress: function() {
    logger.trace('SotaServer::_initExpress initializing express application...');
    var myApp = require('./initializer/Express')(_realConfig);
    var myServer = require('http').createServer(myApp);

    this._initLocalization(myApp);
    this._initMiddlewares(myApp);
    this._initPolicies(myApp);
    this._loadControllers(myApp);
    this._loadModels(myApp);
    this._loadServices(myApp);
    this._loadExternalServices(myApp);
    this._setupLodash(myApp);
    this._setupCheckit(myApp);
    this._setupPassport(myApp);
    this._setupCache(myApp);
    this._setupRoutes(myApp);
    this._initSocket(myApp, myServer);

    this._setupProcess();

    process.nextTick(function() {
      myServer.listen(_realConfig.port, this.onServerCreated.bind(this));
      myServer.on('error', this.onError.bind(this));
      myServer.on('listening', this.onListening.bind(this));
    }.bind(this));
  },

  _initLocalization: function(myApp) {
    var init = require('./initializer/Localization');
    init(myApp, _realConfig.localizationDirs);
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

  _loadExternalServices: function(myApp) {
    var init = require('./initializer/ExternalService');
    init(myApp, ExternalServiceAdapter, _realConfig.externalServiceDirs);
  },

  _setupLodash: function() {
    var init = require('./initializer/Lodash');
    init(_);
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

  _setupCache: function(myApp) {
    var init = require('./initializer/Cache'),
        cacheDirs = _realConfig.cacheDirs;
    init(myApp, CacheFactory, cacheDirs);
  },

  _setupRoutes: function(myApp) {
    var init = require('./initializer/Routes');
    init(myApp, ControllerFactory, _realConfig);
  },

  _setupProcess: function() {
    // TODO: Handle process-level events
    if (_realConfig.errorHandler) {
      process.on('uncaughtException', _realConfig.errorHandler);
      return;
    }

    // Default error handler
    process.on('uncaughtException', function (err) {
      logger.error('############## process begin uncaught exception info ##############');
      logger.error(err);
      logger.error('############## process  end  uncaught exception info ##############');
    });
  },

  onServerCreated: function() {
    logger.trace('Creating http server. Listening on port: ' + _realConfig.port);
  },

  onListening: function() {
    logger.trace('SotaServer is on listening');
  },

  onError: function(e) {
    logger.error('############## SotaServer begin onError info ##############');
    logger.error('onError: ' + util.inspect(e));
    logger.error('############## SotaServer  end  onError info ##############');
  },

});

module.exports = SotaServer;

module.exports.createServer = function(config) {
  return new SotaServer(config);
};
