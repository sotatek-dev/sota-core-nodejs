var logger = require('log4js').getLogger('Init.Checkit');

module.exports = function(Checkit, dirs) {

  _.forEach(dirs, function(dir) {
    logger.info('Initializer::Checkit dir=' + dir);
    if (!FileUtils.isDirectorySync(dir)) {
      throw new Error('Invalid service directory: ' + dir);
    }

    var files = FileUtils.listFiles(dir, /.js$/i);
    if (!files.length) {
      logger.warn('Checkit directory (' + dir + ') is empty');
      return;
    }

    _.forEach(files, function(file) {
      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid checkit file: ' + file);
      }

      var module = require(file);
      name = path.basename(file, '.js');
      Checkit.Validator.prototype[name] = module;

      logger.info('initialized customized validator: ' + name);
    });

  });

};
