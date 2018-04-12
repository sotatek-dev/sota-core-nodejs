const _             = require('lodash');
const path          = require('path');
const FileUtils     = require('../util/FileUtils');
const SotaCore      = require('../index');
const logger        = SotaCore.getLogger('ModuleLoader');

module.exports = function (coreDir) {
  const modulesMap = {};

  const dirsToLoad = [
    'cache',
    'collection',
    'common',
    'controller',
    'data',
    'entity',
    'error',
    'external_service',
    'middleware',
    'model',
    'policy',
    'service',
    'socket',
    'tools',
    'util',
  ];

  const listFiles = _.reduce(dirsToLoad, (result, dirName) => {
    const dir = path.resolve(coreDir, dirName);
    return result.concat(FileUtils.listFiles(dir, /\.js/));
  }, []);

  return _.reduce(listFiles, (result, filePath) => {
    let relativePath = filePath.replace(coreDir, '');
    if (relativePath.startsWith('/') || relativePath.startsWith('\\')) {
      relativePath = relativePath.slice(1);
    }

    logger.trace(`Module has been loaded: ${relativePath}`);
    result[relativePath] = require(filePath);
    result[relativePath.replace(/\\/g, '/')] = require(filePath);
    return result;
  }, {});
}
