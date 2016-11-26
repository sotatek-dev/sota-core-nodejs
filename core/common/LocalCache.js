'use strict'

var LocalCache = {},
    logger = require('log4js').getLogger('LocalCache'),
    redis = require('redis'),
    client = redis.createClient({
      host: process.env.REDIS_SERVER_ADDRESS,
      port: process.env.REDIS_SERVER_PORT,
    });

client.on('error', function(err) {
  logger.error('On redis error: ' + err);
});

LocalCache.register = function(key, func) {
  if (!key) {
    key = func.name;
  }

  if (LocalCache[key]) {
    logger.warn('Duplicate cache key will be overwritten: ' + key);
  }

  LocalCache[key] = func;
};

module.exports = LocalCache;
