/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _             = require('lodash');
var util          = require('util');
var Class         = require('sota-class').Class;
var logger        = log4js.getLogger('ModelFactory');

/**
 * Hide real private objects from rest of the world
 * No outsider should be able to touch it
 */
var _adaptersConfig = {};
var _registers = {};
var _modelSchema = {};

module.exports = Class.singleton({
  classname: 'ModelFactory',

  setAdaptersConfig: function (adaptersConfig) {
    _adaptersConfig = adaptersConfig;
  },

  setModelSchema: function (modelSchema) {
    _modelSchema = modelSchema;
  },

  getModelSchema: function () {
    return _modelSchema;
  },

  getAdapterConfig: function (key) {
    var config = _adaptersConfig[key];
    if (!config) {
      throw new Error('Cannot find adapter config for key: ' + key);
    }

    config.key = key;
    return config;
  },

  register: function (m) {
    logger.trace('register: ' + m.classname);

    if (!m.classname) {
      logger.error('No classname, invalid model: ' + util.inspect(m));
      return;
    }

    if (!m.tableName) {
      logger.error('No table name, invalid model: ' + m.classname);
      return;
    }

    // Inject columns property from auto-generated object into model class
    var columns = _modelSchema[m.classname];
    m.prototype.columns = m.columns = columns;

    _registers[m.classname] = m;
  },

  get: function (classname) {
    // logger.trace(this.classname + '::get ' + classname)
    return _registers[classname];
  },

  getAll: function () {
    return _.keys(_registers);
  },

  create: function (classname, exSession) {
    if (_registers[classname]) {
      var modelClass = _registers[classname];
      var wConfigName = modelClass.dsConfig.write;
      var rConfigName = modelClass.dsConfig.read;
      if (process.env.NODE_ENV === 'test') {
        wConfigName += '-test';
        rConfigName += '-test';
      }

      var masterConfig = this.getAdapterConfig(wConfigName);
      var slaveConfig = this.getAdapterConfig(rConfigName);
      return new _registers[classname](exSession, masterConfig, slaveConfig);
    }
  }

});
