module.exports = function(app, factory, controllerDirs) {
  _.each(controllerDirs, function(controllerDir) {
    logger.info('SotaServer::_loadControllers controllerDir=' + controllerDir);
    if (!FileUtils.isDirectorySync(controllerDir)) {
      throw new Error('Invalid controller directory: ' + controllerDir);
    }

    var files = FileUtils.listFiles(controllerDir, /Controller.js$/i);
    if (!files.length) {
      logger.warn('Controller directory (' + controllerDir + ') is empty');
      return;
    }

    _.forEach(files, function(file) {
      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid controller file ' + file);
      }

      var module = require(file);
      factory.register(module);
    });
  });
};
