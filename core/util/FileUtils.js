var path      = require('path');
var fs        = require('fs');

function processDir(dirPath, regex, isRecursive, result) {

  var files = fs.readdirSync(dirPath);

  for (var i = 0; i < files.length; i++) {
    var currPath = path.join(dirPath, files[i]);
    var stats = fs.statSync(currPath);

    if (stats.isDirectory()) {
      if (isRecursive) {
        processDir(currPath, regex, isRecursive, result);
      }
    } else {
      if (currPath.match(regex)) {
        result.push(currPath);
      }
    }
  }
}

module.exports = {

  /**
   * Search for files recursively at the directory path
   * that match the provided regular expression.
   * @param {string} startPath - Path of the directory where to search
   * @param {regex} regex (Optional) - regular expression that the result need to match
   * @return An array of relative paths to all files found at startPath
   * that match the provided regex.
   */
  listFiles: function(startPath, options) {
    var regex;
    var isRecursive = true;
    if (options) {
      if (options instanceof RegExp) {
        regex = options;
      } else {
        regex = options.regex;
        isRecursive = !!options.isRecursive;
      }
    }

    var stats = fs.statSync(startPath);

    if (!(stats && stats.isDirectory())) {
      throw new Error('Invalid directory path: ' + startPath);
    }

    var result = [];
    processDir(startPath, regex, isRecursive, result);
    return result;
  },

  /**
   * @return {boolean} true if path points to an actual directory, false otherwise.
   * Throw the error that is not ENOENT
   */
  isDirectorySync: function(path) {
    var stats;
    try {
      stats = fs.statSync(path);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }

    return stats && stats.isDirectory();
  },

  /**
   * @return {boolean} true if path points to an actual file, false otherwise.
   * Throw the error that is not ENOENT
   */
  isFileSync: function(path) {
    var stats;
    try {
      stats = fs.statSync(path);
    } catch (e) {
      if (e.code !== 'ENOENT') {
        throw e;
      }
    }

    return stats && stats.isFile();
  },

};
