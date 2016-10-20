var logger = log4js.getLogger('Initializer');

module.exports = function(app, factory, serviceDirs) {
  _.each(serviceDirs, function(serviceDir) {
    logger.info('Initializer::Service serviceDir=' + serviceDir);
    if (!FileUtils.isDirectorySync(serviceDir)) {
      throw new Error('Invalid service directory: ' + serviceDir);
    }

    var files = FileUtils.listFiles(serviceDir, /.js$/i);
    if (!files.length) {
      logger.warn('Service directory (' + serviceDir + ') is empty');
      return;
    }

    _.forEach(files, function(file) {
      if (file.indexOf('BaseService') > -1 ||
          file.indexOf('ServiceFactory') > -1) {
        // Ignore non-model classes
        return;
      }

      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid service file: ' + file);
      }

      var module = require(file);
      factory.register(module);
    });
  });
};
