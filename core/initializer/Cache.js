/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _               = require('lodash');
var path            = require('path');
var FileUtils       = require('../util/FileUtils');
var CacheFactory    = require('../cache/foundation/CacheFactory');
var logger          = log4js.getLogger('Init.Cache');

module.exports = function (dirs) {
  _.each(dirs, function (dir) {
    logger.trace('Initializer::Cache dir=' + dir);
    if (!FileUtils.isDirectorySync(dir)) {
      throw new Error('Invalid cache directory: ' + dir);
    }

    var files = FileUtils.listFiles(dir, {
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

      var module = require(file);
      CacheFactory.register(path.basename(file, '.js'), module);
    });
  });
};
