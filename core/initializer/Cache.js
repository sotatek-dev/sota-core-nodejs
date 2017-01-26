var path        = require('path');
var logger      = log4js.getLogger('Init.Cache');

module.exports = function(app, CacheFactory, dirs) {
  _.each(dirs, function(dir) {
    logger.trace('Initializer::Cache dir=' + dir);
    if (!FileUtils.isDirectorySync(dir)) {
      throw new Error('Invalid cache directory: ' + dir);
    }

    var files = FileUtils.listFiles(dir, /.js$/i);
    if (!files.length) {
      logger.warn('Cache directory (' + dir + ') is empty');
      return;
    }

    _.forEach(files, function(file) {
      if (file.indexOf('CacheFactory') > -1 ||
          file.indexOf('BaseCache') > -1 ||
          file.indexOf('LocalCache') > -1 ||
          file.indexOf('RedisCache') > -1) {
        // Ignore non-cache handler
        return;
      }

      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid cache file: ' + file);
      }

      var module = require(file);
      CacheFactory.register(path.basename(file, '.js'), module);
    });

  });

  // TODO: find a better way to cache and refresh masterdata version
  function refreshSettings() {
    CacheFactory.getDataVersion(function() {
      setTimeout(refreshSettings, 10000);
    });
  }

  setTimeout(refreshSettings, 1);
};
