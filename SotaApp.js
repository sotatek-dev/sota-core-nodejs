const _           = require('lodash');
const async       = require('async');
const util        = require('util');
const fs          = require('fs');
const path        = require('path');
const logger      = require('./index').getLogger('SotaApp');
const FileUtils   = require('./util/FileUtils');
const Const       = require('./common/Const');
const rootDir     = path.join(path.resolve('.'));

class SotaApp {

  constructor (config, initCallback) {
    this._initCallback = initCallback;
    this._appConfig = {};
    this._configRootDir(config);
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
    this._configConstants(config);
    this._configDBAdapters(config);
    this._configLocalization(config);
    this._configModel(config);
    this._configService(config);
    this._configValidator(config);
    this._configCache(config);
    this._configInitializer(config);
    this._configExternalService(config);

    /**
     * All settings can be overrided via the passed argument here
     */
    if (config) {
      this._appConfig = _.merge(this._appConfig, config);
    }
  }

  _configRootDir (config) {
    /**
     * rootDir is absolute path to the application's directory
     */
    let rootDir = path.join(path.resolve('.'));
    if (config.rootDir && FileUtils.isDirectorySync(config.rootDir)) {
      rootDir = config.rootDir;
    }

    this._appConfig.rootDir = rootDir;
  }

  _configConstants (config) {
    let appConst = {};

    /**
     * Application's defined constants
     */
    let constConfigFile = path.resolve(rootDir, 'app', 'common', 'Const.js');
    if (FileUtils.isFileSync(constConfigFile)) {
      appConst = _.assign(appConst, require(constConfigFile) || {});
    }

    if (_.isPlainObject(config.const)) {
      appConst = _.assign(appConst, config.const);
    }

    /**
     * Extend the core's constants by the app's ones
     */
    if (appConst) {
      for (let key in appConst) {
        Const[key] = appConst[key];
      }
    }
  }

  _configDBAdapters () {
    /**
     * Local configuration
     */
    let localConfig = {};
    let rootDir = this._appConfig.rootDir;
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
    let rootDir = this._appConfig.rootDir;
    let appLocalizationDir = path.resolve(rootDir, 'app', 'localizations');
    localizationDirs.push(path.resolve(__dirname, 'localization'));
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
    let rootDir = this._appConfig.rootDir;
    let appModelDir = path.resolve(rootDir, 'app', 'models');
    modelDirs.push(path.resolve(__dirname, 'model'));
    if (FileUtils.isDirectorySync(appModelDir)) {
      modelDirs.push(appModelDir);
    }

    this._appConfig.modelDirs = modelDirs;

    /**
     * ModelSchema is auto-generated file, reflects the database structure
     */
    const modelSchemaFile = path.resolve(rootDir, 'config', 'ModelSchema.js');
    const modelSchema = FileUtils.isFileSync(modelSchemaFile) ? require(modelSchemaFile) : {};
    this._appConfig.modelSchema = modelSchema;
  }

  _configService () {
    /**
     * Services are just similar to models
     * - core/service/
     * - app/services/
     */
    let serviceDirs = [];
    let rootDir = this._appConfig.rootDir;

    serviceDirs.push({
      path: path.resolve(__dirname, 'service'),
      isCoreModule: true,
    });

    let appServiceDir = path.resolve(rootDir, 'app', 'services');
    if (FileUtils.isDirectorySync(appServiceDir)) {
      serviceDirs.push({
        path: appServiceDir,
        isCoreModule: false,
      });
    }

    this._appConfig.serviceDirs = serviceDirs;
  }

  _configValidator () {
    /**
     * Rules to check and get parameters
     */
    let checkitDirs = [];
    let rootDir = this._appConfig.rootDir;
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
    let rootDir = this._appConfig.rootDir;
    cacheDirs.push({
      path: path.resolve(__dirname, 'cache'),
      isCoreModule: true,
    });

    let appCacheDir = path.resolve(rootDir, 'app', 'cache');
    if (FileUtils.isDirectorySync(appCacheDir)) {
      cacheDirs.push({
        path: appCacheDir,
        isCoreModule: false,
      });
    }

    this._appConfig.cacheDirs = cacheDirs;
  }

  _configInitializer () {
    /**
     * Cache functions
     */
    let initializerDirs = [];
    let rootDir = this._appConfig.rootDir;
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
    let rootDir = this._appConfig.rootDir;
    let appExternalServiceDir = path.resolve(rootDir, 'app', 'external_services');
    if (FileUtils.isDirectorySync(appExternalServiceDir)) {
      externalServiceDirs.push(appExternalServiceDir);
    }

    this._appConfig.externalServiceDirs = externalServiceDirs;
  }

  _initLocalization () {
    const init = require('./initializer/Localization');
    init(this._appConfig.localizationDirs);
  }

  _loadModels () {
    const init = require('./initializer/Model');
    const adapters = this._appConfig.adapters;
    const schema = this._appConfig.modelSchema;
    const modelDirs = this._appConfig.modelDirs;

    init(adapters, schema, modelDirs);
  }

  _loadServices () {
    const init = require('./initializer/Service');
    const serviceDirs = this._appConfig.serviceDirs;
    init(serviceDirs);
  }

  _loadExternalServices () {
    const init = require('./initializer/ExternalService');
    init(this._appConfig.externalServiceDirs);
  }

  _setupLodash () {
    const init = require('./initializer/Lodash');
    init(_);
  }

  _setupCheckit () {
    const init = require('./initializer/Checkit');
    const checkitDirs = this._appConfig.checkitDirs;
    init(checkitDirs);
  }

  _setupCache () {
    const init = require('./initializer/Cache');
    const cacheDirs = this._appConfig.cacheDirs;
    init(cacheDirs);
  }

  _setupCustomizedInitializers () {
    _.forEach(this._appConfig.initializerDirs, (dir) => {
      if (!FileUtils.isDirectorySync(dir)) {
        throw new Error('Invalid initializer directory: ' + dir);
      }

      const files = FileUtils.listFiles(dir, /.js$/i);
      if (!files.length) {
        logger.warn('Initializer directory (' + dir + ') is empty');
        return;
      }

      _.forEach(files, (file) => {
        if (!FileUtils.isFileSync(file)) {
          throw new Error('Invalid initializer file: ' + file);
        }

        const init = require(file);
        init(this._appConfig);
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

module.exports = SotaApp;
