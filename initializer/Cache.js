/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const _               = require('lodash');
const path            = require('path');
const FileUtils       = require('../util/FileUtils');
const CacheFactory    = require('../cache/foundation/CacheFactory');
const logger          = log4js.getLogger('Init.Cache');

module.exports = (defs) => {
  _.each(defs, (def) => {
    const dir = def.path;
    const isCoreModule = def.isCoreModule;

    logger.trace('Initializer::Cache dir=' + dir);
    if (!FileUtils.isDirectorySync(dir)) {
      throw new Error('Invalid cache directory: ' + dir);
    }

    const files = FileUtils.listFiles(dir, {
      regex: /.js$/i,
      isRecursive: false
    });

    if (!files.length) {
      logger.warn('Cache directory (' + dir + ') is empty');
      return;
    }

    _.forEach(files, function (file) {
      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid cache file: ' + file);
      }

      const module = require(file);
      CacheFactory.register(path.basename(file, '.js'), module, isCoreModule);
    });
  });
};
