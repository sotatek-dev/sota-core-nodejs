const child_process = require('child_process');

module.exports = function () {
  try {
    const revision = child_process
                      .execSync('git rev-parse HEAD')
                      .toString()
                      .trim();
    logger.info('Current git revision: ' + revision);
  } catch (e) {
    logger.warn('Cannot get curent git revision');
    logger.warn(e);
  }
}