var SotaServer            = require('../core/SotaServer');
var FileUtils             = require('../core/util/FileUtils');
var MySQLSchemaGenerator  = require('../core/data/mysql/MySQLSchemaGenerator');
var Adapters              = require('../config/Adapters');
var LocalConfig           = require('../config/Local');

(function(){

  if (LocalConfig.adapters) {
    Adapters = _.merge(Adapters, LocalConfig.adapters);
  }

  var rootDir = path.join(path.resolve('.')),
      coreModelDir = path.resolve(rootDir, 'core', 'model'),
      appModelDir = path.resolve(rootDir, 'app', 'models'),
      files = FileUtils.listFiles(coreModelDir, /.js$/i),
      files = files.concat(FileUtils.listFiles(appModelDir, /.js$/i)),
      tables = [],
      config = Adapters['mysql-master'],
      targetFile = path.resolve(rootDir, 'config', 'ModelSchema.js');

  if (!files.length) {
    throw new Error('Model directory (' + modelDir + ') is empty');
  }

  _.forEach(files, function(file) {
    if (!FileUtils.isFileSync(file)) {
      throw new Error('Invalid model file: ' + file);
    }

    var model = require(file);
    if (model.tableName) {
      tables.push(model);
    }
  });

  var schemaGetter = new MySQLSchemaGenerator(config, tables, targetFile);
  schemaGetter.run();

})();
