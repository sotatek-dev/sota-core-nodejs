/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _             = require('lodash')
var path          = require('path')
var FileUtils     = require('../util/FileUtils')
var PolicyManager = require('../policy/PolicyManager')
var logger        = log4js.getLogger('Init.Policy')

module.exports = function (dirs) {
  _.each(dirs, function (dir) {
    logger.trace('Initializer::Policy dir=' + dir)
    if (!FileUtils.isDirectorySync(dir)) {
      throw new Error('Invalid policy directory: ' + dir)
    }

    var files = FileUtils.listFiles(dir, /.js$/i)
    if (!files.length) {
      logger.warn('policy directory (' + dir + ') is empty')
      return
    }

    _.forEach(files, function (file) {
      if (file.indexOf('PolicyManager') > -1) {
        // Ignore factory class
        return
      }

      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid policy file: ' + file)
      }

      var module = require(file)
      PolicyManager.register(path.basename(file, '.js'), module)
    })
  })
}
