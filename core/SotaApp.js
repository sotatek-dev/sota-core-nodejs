/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */

var _ = global._ = require('lodash');
global.async = require('async');
var util = global.util = require('util');
global.Checkit = require('cc-checkit');
global.hbs = require('hbs');

var fs          = require('fs');
var path        = require('path');
setupLog();
var logger      = log4js.getLogger('SotaApp');
var rootDir     = path.join(path.resolve('.'));
var FileUtils   = require('./util/FileUtils');
getGitRevision();

class SotaApp {

  constructor (config, initCallback) {
    this._initCallback = initCallback;
    this._appConfig = {};
    this._resolveConfig(config);
  }

  start () {
    this._initLocalization();
    this._loadModels();
    this._loadServices();
    this._loadExternalServices();
    this._setupLodash();
    this._setupCheckit();
    this._setupCache();
    this._setupCustomizedInitializers();
  }

  getConfig () {
    return this._appConfig;
  }

  _resolveConfig (config) {
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
      _.each(_.keys(config), function (p) {
        this._appConfig[p] = config[p];
      }.bind(this));
    }
  }

  _configRootDir (config) {
    /**
     * rootDir is absolute path to the application's directory
     */
    this._appConfig.rootDir = rootDir;
  }

  _configDBAdapters () {
    /**
     * Local configuration
     */
    let localConfig = {};
    let localConfigFile = path.join(rootDir, 'config', 'Local.js');
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

  _configLocalization () {
    /**
     * Localization
     */
    let localizationDirs = [];
    let appLocalizationDir = path.resolve(rootDir, 'app', 'localizations');
    localizationDirs.push(path.resolve(rootDir, 'core', 'localization'));
    if (FileUtils.isDirectorySync(appLocalizationDir)) {
      localizationDirs.push(appLocalizationDir);
    }

    this._appConfig.localizationDirs = localizationDirs;
  }

  _configModel () {
    /**
     * There're some models are predefined in core (like UserModel)
     * Others will be made or overrided for particular application's business
     * All model classes in those directory will be loaded:
     * - core/model/
     * - app/models/
     */
    let modelDirs = [];
    let appModelDir = path.resolve(rootDir, 'app', 'models');
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

  _configService () {
    /**
     * Services are just similar to models
     * - core/service/
     * - app/services/
     */
    let serviceDirs = [];
    let appServiceDir = path.resolve(rootDir, 'app', 'services');
    serviceDirs.push(path.resolve(rootDir, 'core', 'service'));
    if (FileUtils.isDirectorySync(appServiceDir)) {
      serviceDirs.push(appServiceDir);
    }

    this._appConfig.serviceDirs = serviceDirs;
  }

  _configValidator () {
    /**
     * Rules to check and get parameters
     */
    let checkitDirs = [];
    let appCheckitDir = path.resolve(rootDir, 'app', 'checkits');
    if (FileUtils.isDirectorySync(appCheckitDir)) {
      checkitDirs.push(appCheckitDir);
    }

    this._appConfig.checkitDirs = checkitDirs;
  }

  _configCache () {
    /**
     * Cache functions
     */
    let cacheDirs = [];
    let appCacheDir = path.resolve(rootDir, 'app', 'cache');
    cacheDirs.push(path.resolve(rootDir, 'core', 'cache'));
    if (FileUtils.isDirectorySync(appCacheDir)) {
      cacheDirs.push(appCacheDir);
    }

    this._appConfig.cacheDirs = cacheDirs;
  }

  _configInitializer () {
    /**
     * Cache functions
     */
    let initializerDirs = [];
    let appInitializerDir = path.resolve(rootDir, 'app', 'initializers');
    if (FileUtils.isDirectorySync(appInitializerDir)) {
      initializerDirs.push(appInitializerDir);
    }

    this._appConfig.initializerDirs = initializerDirs;
  }

  _configExternalService () {
    /**
     * External service handlers
     */
    let externalServiceDirs = [];
    let appExternalServiceDir = path.resolve(rootDir, 'app', 'external_services');
    if (FileUtils.isDirectorySync(appExternalServiceDir)) {
      externalServiceDirs.push(appExternalServiceDir);
    }

    this._appConfig.externalServiceDirs = externalServiceDirs;
  }

  _configConstants () {
    /**
     * Application's defined constants
     */
    let constConfigFile = path.resolve(rootDir, 'app', 'common', 'Const.js');
    if (FileUtils.isFileSync(constConfigFile)) {
      this._appConfig.const = require(constConfigFile);
    }

    var coreConst = require('./common/Const');

    /**
     * Extend the core's constants by the app's ones
     */
    global.Const = _.merge(coreConst, this._appConfig.const || {});
  }

  _initLocalization () {
    var init = require('./initializer/Localization');
    init(this._appConfig.localizationDirs);
  }

  _loadModels () {
    var init = require('./initializer/Model');
    var adapters = this._appConfig.adapters;
    var schema = this._appConfig.modelSchema;
    var modelDirs = this._appConfig.modelDirs;

    init(adapters, schema, modelDirs);
  }

  _loadServices () {
    var init = require('./initializer/Service');
    var serviceDirs = this._appConfig.serviceDirs;
    init(serviceDirs);
  }

  _loadExternalServices () {
    var init = require('./initializer/ExternalService');
    init(this._appConfig.externalServiceDirs);
  }

  _setupLodash () {
    var init = require('./initializer/Lodash');
    init(_);
  }

  _setupCheckit () {
    var init = require('./initializer/Checkit');
    var checkitDirs = this._appConfig.checkitDirs;
    init(checkitDirs);
  }

  _setupCache () {
    var init = require('./initializer/Cache');
    var cacheDirs = this._appConfig.cacheDirs;
    init(cacheDirs);
  }

  _setupCustomizedInitializers () {
    var self = this;
    _.forEach(self._appConfig.initializerDirs, function (dir) {
      if (!FileUtils.isDirectorySync(dir)) {
        throw new Error('Invalid initializer directory: ' + dir);
      }

      var files = FileUtils.listFiles(dir, /.js$/i);
      if (!files.length) {
        logger.warn('Initializer directory (' + dir + ') is empty');
        return;
      }

      _.forEach(files, function (file) {
        if (!FileUtils.isFileSync(file)) {
          throw new Error('Invalid initializer file: ' + file);
        }

        var init = require(file);
        init(self._appConfig);
      });
    });
  }

  onServerCreated () {
    logger.trace('Creating http server. Listening on port: ' + this._appConfig.port);
  }

  onListening () {
    logger.trace('SotaServer is on listening');
  }

  onError (e) {
    logger.error('############## SotaServer begin onError info ##############');
    logger.error('onError: ' + util.inspect(e));
    logger.error('############## SotaServer  end  onError info ##############');
  }

}

function setupLog() {
  global.log4js = require('log4js');
  var logDir = '.logs';
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }

  var tmpDir = '.tmp';
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir);
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
      }
    ]
  };
  log4js.configure(logConfig);
}

function getGitRevision() {
  try {
    var revision = require('child_process')
                    .execSync('git rev-parse HEAD')
                    .toString().trim();
    logger.info('Current git revision: ' + revision);
  } catch (e) {
    logger.warn('Cannot get curent git revision');
    logger.warn(e);
  }
}

module.exports = SotaApp;
module.exports.redis = require('redis');
module.exports.Class = require('sota-class').Class;
module.exports.Interface = require('sota-class').Interface;
