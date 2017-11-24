/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _               = require('lodash');
var path            = require('path');
var FileUtils       = require('../util/FileUtils');
var logger          = log4js.getLogger('Init.Middleware');

var defaultList = [
  'requestLogger',
  'cookieParser',
  'bodyParser',
  'bodyMultipart',
  'expressSession',
  'www',
  'passportInit',
  'passportSession'
];

function getModuleMap(dirs) {
  var _map = {};
  _.forEach(dirs, function (dir) {
    if (!FileUtils.isDirectorySync(dir)) {
      logger.warn('Invalid middleware directory: ' + dir);
      return;
    }

    var files = FileUtils.listFiles(dir, /.js$/i);
    if (!files.length) {
      logger.warn('Middleware directory (' + dir + ') is empty');
      return;
    }

    _.forEach(files, function (file) {
      if (!FileUtils.isFileSync(file)) {
        throw new Error('Invalid middleware file: ' + file);
      }

      var moduleName = path.basename(file, '.js');
      _map[moduleName] = file;
    });
  });

  return _map;
}

module.exports = function (app, config) {
  var moduleMap = getModuleMap(config.middlewareDirs);
  var beforeList = config.middlewares.before || config.middlewares.list || defaultList;
  var afterList = config.middlewares.after || [];

  var list = beforeList.concat(['sotaDefault']).concat(afterList);

  for (let i = 0; i < list.length; i++) {
    let moduleName = list[i];
    if (!moduleMap[moduleName]) {
      throw new Error('Invalid middleware: ' + moduleName);
    }

    let middleware = require(moduleMap[moduleName])(app, config);
    app.use(middleware);
  }
};
