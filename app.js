Config          = require('./config/Config');
Routes          = require('./config/Routes');
SotaServer      = require('./core/SotaServer');

(function boot() {
  logger.info('Start booting application...');

  var rootDir = path.join(path.resolve('.'));
  logger.info('[BOOTING] Root dir: ' + rootDir);

  var controllerDirs  = [],
      modelDirs       = [],
      serviceDirs     = [];
  controllerDirs.push(path.resolve(rootDir, 'app', 'controllers'));
  modelDirs.push(path.resolve(rootDir, 'app', 'models'));
  modelDirs.push(path.resolve(rootDir, 'core', 'model'));
  serviceDirs.push(path.resolve(rootDir, 'app', 'services'));
  serviceDirs.push(path.resolve(rootDir, 'core', 'service'));

  var app = new SotaServer({
    port            : Config.port,
    secret          : Config.secret,
    adapters        : Config.adapters,
    controllerDirs  : controllerDirs,
    modelDirs       : modelDirs,
    serviceDirs     : serviceDirs,
    routes          : Routes,
  });

})();

process.on('SIGINT', function() {
  process.exit();
});
