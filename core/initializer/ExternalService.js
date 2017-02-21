var path        = require('path');
var logger      = log4js.getLogger('Init.ExternalService');

module.exports = function(ExternalServiceAdapter, dirs) {
  _.each(dirs, function(dir) {
    logger.trace('Initializer::ExternalService dir=' + dir);
    if (!FileUtils.isDirectorySync(dir)) {
      throw new Error('Invalid external service directory: ' + dir);
    }

    var files = FileUtils.listFiles(dir, /.js$/i);
    if (!files.length) {
      logger.warn('External service directory (' + dir + ') is empty');
      return;
    }

    _.forEach(files, function(file) {
      if (file.indexOf('ExternalServiceAdapter') > -1) {
        // Ignore non-service handler
        return;
      }

      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid external service file: ' + file);
      }

      var module = require(file);
      ExternalServiceAdapter.register(path.basename(file, '.js'), module);
    });

  });
};
