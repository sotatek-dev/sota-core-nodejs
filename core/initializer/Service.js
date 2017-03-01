/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _                   = require('lodash')
var bb                  = require('bluebird')
var FileUtils           = require('../util/FileUtils')
var ServiceFactory      = require('../service/foundation/ServiceFactory')
var logger              = log4js.getLogger('Init.Service')

module.exports = function (serviceDirs) {
  _.each(serviceDirs, function (serviceDir) {
    logger.trace('Initializer::Service serviceDir=' + serviceDir)
    if (!FileUtils.isDirectorySync(serviceDir)) {
      throw new Error('Invalid service directory: ' + serviceDir)
    }

    var files = FileUtils.listFiles(serviceDir, /.js$/i)
    if (!files.length) {
      logger.warn('Service directory (' + serviceDir + ') is empty')
      return
    }

    _.forEach(files, function (file) {
      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid service file: ' + file)
      }

      var module = require(file)

      for (let prop in module.prototype) {
        if (typeof module.prototype[prop] !== 'function') {
          continue
        }

        module.prototype[prop + '_promisified'] = bb.promisify(module.prototype[prop])
      }

      ServiceFactory.register(module)
    })
  })
}
