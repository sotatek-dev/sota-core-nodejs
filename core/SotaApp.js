// Global built-in depencencies
fs                      = require('fs');
path                    = require('path');
util                    = require('util');
crypto                  = require('crypto');

// Global external libs
_                       = require('lodash');
co                      = require('co');
bb                      = require('bluebird');
async                   = require('async');
moment                  = require('moment');
redis                   = require('redis');
request                 = require('superagent');
Checkit                 = require('cc-checkit');
Class                   = require('sota-class').Class;
Interface               = require('sota-class').Interface;

// Log
log4js                  = require('log4js');
setupLog();
logger                  = log4js.getLogger('SotaServer');

// Singletons
ExternalServiceAdapter  = require('./external_service/foundation/ExternalServiceAdapter');
getText                 = require('./factory/LocalizationFactory').getText;
CacheFactory            = require('./cache/foundation/CacheFactory');
ControllerFactory       = require('./controller/ControllerFactory');
LocalCache              = require('./cache/foundation/LocalCache');
RedisCache              = require('./cache/foundation/RedisCache');
ServiceFactory          = require('./service/ServiceFactory');
SocketManager           = require('./socket/SocketManager');
PolicyManager           = require('./policy/PolicyManager');
AdapterFactory          = require('./data/AdapterFactory');
ModelFactory            = require('./model/ModelFactory');
ErrorFactory            = require('./error/ErrorFactory');
FileUtils               = require('./util/FileUtils');
Const                   = require('./common/Const');
Utils                   = require('./util/Utils');

try {
  var revision = require('child_process')
  .execSync('git rev-parse HEAD')
  .toString().trim();
} catch (e) {
  logger.warn('Cannot get curent git revision');
  logger.warn(e);
}

let rootDir = path.join(path.resolve('.'));

class SotaApp {

  constructor(config, initCallback) {
    this._initCallback = initCallback;
    this._appConfig = {};
    this._resolveConfig(config);
  }

  start() {
    this._initLocalization();
    this._initPolicies();
    this._loadControllers();
    this._loadModels();
    this._loadServices();
    this._loadExternalServices();
    this._setupLodash();
    this._setupCheckit();
    this._setupCache();
    this._setupCustomizedInitializers();
  }

  getConfig() {
    return this._appConfig;
  }

  _resolveConfig(config) {
    this._configRootDir(config);
    this._configDBAdapters(config);
    this._configLocalization(config);
    this._configModel(config);
    this._configService(config);
    this._configValidator(config);
    this._configCache(config);
    this._configInitializer(config);
    this._configExternalService(config);
    this._configConstants(config);

    /**
     * All settings can be overrided via the passed argument here
     */
    if (config) {
      _.each(_.keys(config), function(p) {
        this._appConfig[p] = config[p];
      }.bind(this));
    }
  }

  _configRootDir(config) {
    /**
     * rootDir is absolute path to the application's directory
     */
    this._appConfig.rootDir = rootDir;
  }

  _configDBAdapters() {
    /**
     * Local configuration
     */
    let localConfig = {},
        localConfigFile = path.join(rootDir, 'config', 'Local.js');
    if (FileUtils.isFileSync(localConfigFile)) {
      localConfig = require(localConfigFile);
    }

     /**
      * Adapter settings
      */
    this._appConfig.adapters = _.merge(
      require(path.resolve(rootDir, 'config', 'Adapters')),
      localConfig.adapters
    );
  }

  _configLocalization() {
    /**
     * Localization
     */
    let localizationDirs = [],
        appLocalizationDir = path.resolve(rootDir, 'app', 'localizations');
    localizationDirs.push(path.resolve(rootDir, 'core', 'localization'));
    if (FileUtils.isDirectorySync(appLocalizationDir)) {
      localizationDirs.push(appLocalizationDir);
    }
    this._appConfig.localizationDirs = localizationDirs;
  }

  _configModel() {
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
    this._appConfig.modelDirs = modelDirs;

    /**
     * ModelSchema is auto-generated file, reflects the database structure
     */
    var modelSchema = require(path.resolve(rootDir, 'config', 'ModelSchema'));
    this._appConfig.modelSchema = modelSchema;
  }

  _configService() {
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
    this._appConfig.serviceDirs = serviceDirs;
  }

  _configValidator() {
    /**
     * Rules to check and get parameters
     */
    let checkitDirs = [],
        appCheckitDir = path.resolve(rootDir, 'app', 'checkits');
    if (FileUtils.isDirectorySync(appCheckitDir)) {
      checkitDirs.push(appCheckitDir);
    }
    this._appConfig.checkitDirs = checkitDirs;
  }

  _configCache() {
    /**
     * Cache functions
     */
    let cacheDirs = [],
        appCacheDir = path.resolve(rootDir, 'app', 'cache');
    cacheDirs.push(path.resolve(rootDir, 'core', 'cache'));
    if (FileUtils.isDirectorySync(appCacheDir)) {
      cacheDirs.push(appCacheDir);
    }
    this._appConfig.cacheDirs = cacheDirs;
  }

  _configInitializer() {
    /**
     * Cache functions
     */
    let initializerDirs = [],
        appInitializerDir = path.resolve(rootDir, 'app', 'initializers');
    if (FileUtils.isDirectorySync(appInitializerDir)) {
      initializerDirs.push(appInitializerDir);
    }
    this._appConfig.initializerDirs = initializerDirs;
  }

  _configExternalService() {
    /**
     * External service handlers
     */
    let externalServiceDirs = [],
        appExternalServiceDir = path.resolve(rootDir, 'app', 'external_services');
    if (FileUtils.isDirectorySync(appExternalServiceDir)) {
      externalServiceDirs.push(appExternalServiceDir);
    }
    this._appConfig.externalServiceDirs = externalServiceDirs;
  }

  _configConstants() {
    /**
     * Application's defined constants
     */
    let constConfigFile = path.resolve(rootDir, 'app', 'common', 'Const.js');
    if (FileUtils.isFileSync(constConfigFile)) {
      this._appConfig.const = require(constConfigFile);
    }

    /**
     * Extend the core's constants by the app's ones
     */
    Const = _.merge(Const, this._appConfig.const || {});
  }

  _setupInitializers() {
    this._initLocalization();
    this._loadModels();
    this._loadServices();
    this._loadExternalServices();
    this._setupLodash();
    this._setupCheckit();
    this._setupCache();
  }

  _initLocalization() {
    var init = require('./initializer/Localization');
    init(_appConfig.localizationDirs);
  }

  _loadModels() {
    var init = require('./initializer/Model'),
        adapters = _appConfig.adapters,
        schema = _appConfig.modelSchema,
        modelDirs = _appConfig.modelDirs;

    init(ModelFactory, adapters, schema, modelDirs);
  }

  _loadServices() {
    var init = require('./initializer/Service'),
        serviceDirs = _appConfig.serviceDirs;
    init(ServiceFactory, serviceDirs);
  }

  _loadExternalServices() {
    var init = require('./initializer/ExternalService');
    init(ExternalServiceAdapter, this._appConfig.externalServiceDirs);
  }

  _setupLodash() {
    var init = require('./initializer/Lodash');
    init(_);
  }

  _setupCheckit() {
    var init = require('./initializer/Checkit'),
        checkitDirs = this._appConfig.checkitDirs;
    init(Checkit, checkitDirs);
  }

  _setupCache() {
    var init = require('./initializer/Cache'),
        cacheDirs = this._appConfig.cacheDirs;
    init(CacheFactory, cacheDirs);
  }

  _initLocalization() {
    var init = require('./initializer/Localization');
    init(this._appConfig.localizationDirs);
  }

  _initPolicies() {
    var init = require('./initializer/Policy'),
        policyDirs = this._appConfig.policyDirs;

    init(PolicyManager, policyDirs);
  }

  _loadControllers() {
    var init = require('./initializer/Controller'),
        controllerDirs = this._appConfig.controllerDirs;

    init(ControllerFactory, controllerDirs);
  }

  _loadModels() {
    var init = require('./initializer/Model'),
        adapters = this._appConfig.adapters,
        schema = this._appConfig.modelSchema,
        modelDirs = this._appConfig.modelDirs;

    init(ModelFactory, adapters, schema, modelDirs);
  }

  _loadServices() {
    var init = require('./initializer/Service'),
        serviceDirs = this._appConfig.serviceDirs;
    init(ServiceFactory, serviceDirs);
  }

  _loadExternalServices() {
    var init = require('./initializer/ExternalService');
    init(ExternalServiceAdapter, this._appConfig.externalServiceDirs);
  }

  _setupLodash() {
    var init = require('./initializer/Lodash');
    init(_);
  }

  _setupCheckit() {
    var init = require('./initializer/Checkit'),
        checkitDirs = this._appConfig.checkitDirs;
    init(Checkit, checkitDirs);
  }

  _setupCache() {
    var init = require('./initializer/Cache'),
        cacheDirs = this._appConfig.cacheDirs;
    init(CacheFactory, cacheDirs);
  }

  _setupCustomizedInitializers() {
    var self = this;
    _.forEach(self._appConfig.initializerDirs, function(dir) {
      if (!FileUtils.isDirectorySync(dir)) {
        throw new Error('Invalid initializer directory: ' + dir);
      }

      var files = FileUtils.listFiles(dir, /.js$/i);
      if (!files.length) {
        logger.warn('Initializer directory (' + dir + ') is empty');
        return;
      }

      _.forEach(files, function(file) {
        if (!FileUtils.isFileSync(file)) {
          throw new Error('Invalid initializer file: ' + file);
        }

        var init = require(file);
        init(self._appConfig);
      });
    });
  }

  onServerCreated() {
    logger.trace('Creating http server. Listening on port: ' + this._appConfig.port);
  }

  onListening() {
    logger.trace('SotaServer is on listening');
  }

  onError(e) {
    logger.error('############## SotaServer begin onError info ##############');
    logger.error('onError: ' + util.inspect(e));
    logger.error('############## SotaServer  end  onError info ##############');
  }

}

function setupLog() {
  var logDir = '.logs';
  if (!fs.existsSync(logDir)){
    fs.mkdirSync(logDir);
  }

  // TODO: remove global scope of logger
  var logConfig = {
    replaceConsole: true,
    appenders: [
      {
        type: 'logLevelFilter',
        level: process.env.LOG_LEVEL || 'WARN',
        appender: {
          type: 'console'
        }
      },
      {
        type: 'logLevelFilter',
        level: 'ERROR',
        appender: {
          type: 'dateFile',
          filename: logDir + '/error.log',
          pattern: '.yyyyMMdd',
          alwaysIncludePattern: false
        }
      },
    ]
  };
  log4js.configure(logConfig);
}

module.exports = SotaApp;
