/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _             = require('lodash');
var path          = require('path');
var setText       = require('../factory/LocalizationFactory').setText;
var FileUtils     = require('../util/FileUtils');
var logger        = log4js.getLogger('Init.Localization');

module.exports = function (dirs) {
  _.each(dirs, function (dir) {
    logger.trace('Initializer::Localization dir=' + dir);
    if (!FileUtils.isDirectorySync(dir)) {
      throw new Error('Invalid localization directory: ' + dir);
    }

    var files = FileUtils.listFiles(dir, /.js$/i);
    if (!files.length) {
      logger.warn('Localization directory (' + dir + ') is empty');
      return;
    }

    _.forEach(files, function (file) {
      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid localization file: ' + file);
      }

      var texts = require(file);
      var locale = path.basename(file, '.js');
      for (let key in texts) {
        setText(key, locale, texts[key]);
      }
    });
  });
};
