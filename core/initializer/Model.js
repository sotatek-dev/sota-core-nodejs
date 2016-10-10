module.exports = function(app, factory, modelDirs) {
  _.each(modelDirs, function(modelDir) {
    logger.info('Initializer::Model modelDir=' + modelDir);
    if (!FileUtils.isDirectorySync(modelDir)) {
      throw new Error('Invalid model directory: ' + util.inspect(modelDir));
    }

    var files = FileUtils.listFiles(modelDir, /.js$/i);
    if (!files.length) {
      logger.warn('Model directory (' + modelDir + ') is empty');
      return;
    }

    _.forEach(files, function(file) {
      if (file.indexOf('BaseModel') > - 1 ||
          file.indexOf('VersionedModel') > - 1 ||
          file.indexOf('ModelFactory') > -1) {
        // Ignore non-model classes
        return;
      }

      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid model file: ' + file);
      }

      var module = require(file);
      factory.register(module);
    });
  });
};