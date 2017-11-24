/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const _                   = require('lodash');
const bb                  = require('bluebird');
const FileUtils           = require('../util/FileUtils');
const ServiceFactory      = require('../service/foundation/ServiceFactory');
const logger              = log4js.getLogger('Init.Service');

module.exports = (defs) => {
  _.each(defs, def => {
    const serviceDir = def.path;
    const isCoreModule = def.isCoreModule;

    logger.trace('Initializer::Service serviceDir=' + serviceDir);
    if (!FileUtils.isDirectorySync(serviceDir)) {
      throw new Error('Invalid service directory: ' + serviceDir);
    }

    const files = FileUtils.listFiles(serviceDir, /.js$/i);
    if (!files.length) {
      logger.warn('Service directory (' + serviceDir + ') is empty');
      return;
    }

    _.forEach(files, (file) => {
      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid service file: ' + file);
      }

      const module = require(file);

      for (let prop in module.prototype) {
        if (typeof module.prototype[prop] !== 'function') {
          continue;
        }

        module.prototype[prop + '_promisified'] = bb.promisify(module.prototype[prop]);
      }

      ServiceFactory.register(module, isCoreModule);
    });
  });
};
