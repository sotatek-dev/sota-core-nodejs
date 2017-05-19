/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _                   = require('lodash');
var FileUtils           = require('../util/FileUtils');
var ControllerFactory   = require('../controller/ControllerFactory');
var logger              = log4js.getLogger('Init.Controller');

module.exports = function (controllerDirs) {
  _.each(controllerDirs, function (controllerDir) {
    logger.trace('Load controllers dir=' + controllerDir);
    if (!FileUtils.isDirectorySync(controllerDir)) {
      throw new Error('Invalid controller directory: ' + controllerDir);
    }

    var files = FileUtils.listFiles(controllerDir, /Controller.js$/i);
    if (!files.length) {
      logger.warn('Controller directory (' + controllerDir + ') is empty');
      return;
    }

    _.forEach(files, function (file) {
      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid controller file ' + file);
      }

      var module = require(file);
      ControllerFactory.register(module);
    });
  });
};
