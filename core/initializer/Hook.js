var logger = log4js.getLogger('Initializer');

module.exports = function(app, config) {
  // TODO: handle hookers' extended config here
  logger.info('Hook::initialize: config=' + config);
};
