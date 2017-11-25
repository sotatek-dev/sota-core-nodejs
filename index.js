/**
 * Setup logger
 */
const log4js = require('./bootstrap/Logger')();
const logger = log4js.getLogger('SotaCore');

/**
 * Expose logger getter
 */
module.exports.getLogger = function (loggerName) {
  return log4js.getLogger(loggerName);
}

/**
 * Setup modules loader
 */
const modulesMap = require('./bootstrap/ModuleLoader')(__dirname);

module.exports.load = function (moduleName) {
  if (!modulesMap[moduleName] && !modulesMap[moduleName + '.js']) {
    throw new Error(`Cannot get module: ${moduleName}`)
  }

  return modulesMap[moduleName] || modulesMap[moduleName + '.js'];
}

let instance = null;

module.exports.createApp = function (options) {
  if (instance !== null) {
    throw new Error(`Only support 1 app instance at the same time for now.`);
  }

  const SotaApp = require('./SotaApp');
  instance = new SotaApp(options);
  return instance;
};

module.exports.createServer = function (options) {
  if (instance !== null) {
    throw new Error(`Only support 1 server instance at the same time for now.`);
  }

  const SotaServer = require('./SotaServer');
  instance = new SotaServer(options);
  return instance;
};

module.exports.getInstance = function () {
  return instance;
};

// Expose some core's dependencies to application layer
module.exports.redis = require('redis');
module.exports.Class = require('sota-class').Class;
module.exports.Inteface = require('sota-class').Inteface;
