var logger = require('log4js').getLogger('Init.Model');

module.exports = function(app, ModelFactory, adaptersConfig, modelSchema, modelDirs) {

  // Store config of provided adapters/connections
  ModelFactory.setAdaptersConfig(adaptersConfig);
  ModelFactory.setModelSchema(modelSchema);

  // Load
  _.each(modelDirs, function(modelDir) {
    logger.trace('Initializer::Model modelDir=' + modelDir);
    if (!FileUtils.isDirectorySync(modelDir)) {
      throw new Error('Invalid model directory: ' + util.inspect(modelDir));
    }

    var files = FileUtils.listFiles(modelDir, /.js$/i);
    if (!files.length) {
      logger.warn('Model directory (' + modelDir + ') is empty');
      return;
    }

    _.forEach(files, function(file) {
      if (file.indexOf('BaseModel') > -1 ||
          file.indexOf('VersionedModel') > -1 ||
          file.indexOf('CachedModel') > -1 ||
          file.indexOf('ModelFactory') > -1) {
        // Ignore non-model classes
        return;
      }

      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid model file: ' + file);
      }

      var module = require(file);
      ModelFactory.register(module);
    });
  });
};
