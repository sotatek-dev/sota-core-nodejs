/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const _                   = require('lodash');
const FileUtils           = require('../util/FileUtils');
const ControllerFactory   = require('../controller/ControllerFactory');
const logger              = log4js.getLogger('Init.Controller');

module.exports = (defs) => {
  _.each(defs, (def) => {
    const controllerDir = def.path;
    const isCoreModule = def.isCoreModule;

    logger.trace('Load controllers dir=' + controllerDir);
    if (!FileUtils.isDirectorySync(controllerDir)) {
      throw new Error('Invalid controller directory: ' + controllerDir);
    }

    const files = FileUtils.listFiles(controllerDir, /.js$/i);
    if (!files.length) {
      logger.warn('Controller directory (' + controllerDir + ') is empty');
      return;
    }

    _.forEach(files, function (file) {
      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid controller file ' + file);
      }

      const module = require(file);
      ControllerFactory.register(module, isCoreModule);
    });
  });
};
