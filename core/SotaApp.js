fs                      = require('fs');
path                    = require('path');
util                    = require('util');
crypto                  = require('crypto');

_                       = require('lodash');
co                      = require('co');
bb                      = require('bluebird');
async                   = require('async');
moment                  = require('moment');
redis                   = require('redis');
request                 = require('superagent');
Checkit                 = require('cc-checkit');
log4js                  = require('log4js');
Class                   = require('sota-class').Class;
Interface               = require('sota-class').Interface;

setupLog();

CacheFactory            = require('./cache/foundation/CacheFactory');
LocalCache              = require('./cache/foundation/LocalCache');
RedisCache              = require('./cache/foundation/RedisCache');
Const                   = require('./common/Const');
FileUtils               = require('./util/FileUtils');
Utils                   = require('./util/Utils');

BaseEntity              = require('./entity/BaseEntity');
BaseModel               = require('./model/BaseModel');
BaseService             = require('./service/BaseService');
ErrorFactory            = require('./error/ErrorFactory');
ModelFactory            = require('./model/ModelFactory');
ServiceFactory          = require('./service/ServiceFactory');
AdapterFactory          = require('./data/AdapterFactory');
ExternalServiceAdapter  = require('./external_service/foundation/ExternalServiceAdapter');
getText                 = require('./factory/LocalizationFactory').getText;

/**
 * Private properties
 * Declare here to prevent accessing from outside
 */
var _appConfig = {};
getModelSchema = function() {
  return _appConfig.modelSchema;
};

class SotaApp {

  constructor(config) {
    this._resolveConfig(config);
    this._setupInitializers();
    this._setupProcess();
  }

  start() {
    // TODO
  }

  getConfig() {
    return _appConfig;
  }

  _resolveConfig(config) {
    /**
     * rootDir is absolute path to the application's directory
     */
    let rootDir = path.join(path.resolve('.'));
    _appConfig.rootDir = rootDir;

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
    _appConfig.adapters = _.merge(
      require(path.resolve(rootDir, 'config', 'Adapters')),
      localConfig.adapters
    );

    /**
     * Port and secret phrase for encryption
     * Normally are defined in .env file
     */
    _appConfig.port = process.env.PORT;
    _appConfig.secret = process.env.SECRET;

    /**
     * Localization
     */
    let localizationDirs = [],
        appLocalizationDir = path.resolve(rootDir, 'app', 'localizations');
    localizationDirs.push(path.resolve(rootDir, 'core', 'localization'));
    if (FileUtils.isDirectorySync(appLocalizationDir)) {
      localizationDirs.push(appLocalizationDir);
    }
    _appConfig.localizationDirs = localizationDirs;

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
    _appConfig.modelDirs = modelDirs;

    /**
     * ModelSchema is auto-generated file, reflects the database structure
     */
    var modelSchema = require(path.resolve(rootDir, 'config', 'ModelSchema'));
    _appConfig.modelSchema = modelSchema;

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
    _appConfig.serviceDirs = serviceDirs;

    /**
     * Rules to check and get parameters
     */
    let checkitDirs = [],
        appCheckitDir = path.resolve(rootDir, 'app', 'checkits');
    if (FileUtils.isDirectorySync(appCheckitDir)) {
      checkitDirs.push(appCheckitDir);
    }
    _appConfig.checkitDirs = checkitDirs;

    /**
     * Cache functions
     */
    let cacheDirs = [],
        appCacheDir = path.resolve(rootDir, 'app', 'cache');
    cacheDirs.push(path.resolve(rootDir, 'core', 'cache'));
    if (FileUtils.isDirectorySync(appCacheDir)) {
      cacheDirs.push(appCacheDir);
    }
    _appConfig.cacheDirs = cacheDirs;

    /**
     * External service handlers
     */
    let externalServiceDirs = [],
        appExternalServiceDir = path.resolve(rootDir, 'app', 'external_services');
    if (FileUtils.isDirectorySync(appExternalServiceDir)) {
      externalServiceDirs.push(appExternalServiceDir);
    }
    _appConfig.externalServiceDirs = externalServiceDirs;

    /**
     * Sockets:
     * - app/sockets/
     */
    let socketDirs = [],
        appSocketDir = path.resolve(rootDir, 'app', 'sockets');
    if (FileUtils.isDirectorySync(appSocketDir)) {
      socketDirs.push(appSocketDir);
    }
    _appConfig.socketDirs = socketDirs;

    /**
     * Application's defined constants
     */
    let constConfigFile = path.resolve(rootDir, 'app', 'common', 'Const.js');
    if (FileUtils.isFileSync(constConfigFile)) {
      _appConfig.const = require(constConfigFile);
    }

    /**
     * All settings can be overrided via the passed argument here
     */
    if (config) {
      _.each(_.keys(config), function(p) {
        _appConfig[p] = config[p];
      });
    }

    /**
     * Extend the core's constants by the app's ones
     */
    Const = _.merge(Const, _appConfig.const || {});
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
    init(ExternalServiceAdapter, _appConfig.externalServiceDirs);
  }

  _setupLodash() {
    var init = require('./initializer/Lodash');
    init(_);
  }

  _setupCheckit() {
    var init = require('./initializer/Checkit'),
        checkitDirs = _appConfig.checkitDirs;
    init(Checkit, checkitDirs);
  }

  _setupCache() {
    var init = require('./initializer/Cache'),
        cacheDirs = _appConfig.cacheDirs;
    init(CacheFactory, cacheDirs);
  }

  _setupProcess() {
    // Default error handler
    process.on('uncaughtException', function (err) {
      logger.error('############## process begin uncaught exception info ##############');
      logger.error(err);
      logger.error('############## process  end  uncaught exception info ##############');
    });
  }

}

function setupLog() {
  var logDir = '.logs';
  if (!fs.existsSync(logDir)){
    fs.mkdirSync(logDir);
  }

  // TODO: remove global scope of logger
  var logConfig = {
    "replaceConsole": true,
    "appenders": [
      {
        "type": "logLevelFilter",
        "level": process.env.LOG_LEVEL || 'WARN',
        "appender": {
          "type": "console"
        }
      },
      {
        "type": "logLevelFilter",
        "level": 'ERROR',
        "appender": {
          type: 'dateFile',
          filename: logDir + '/error.log',
          pattern: '.yyyyMMdd',
          alwaysIncludePattern: false
        }
      },
    ]
  };
  log4js.configure(logConfig);
  logger = log4js.getLogger('SotaApp');
}

module.exports = SotaApp;
