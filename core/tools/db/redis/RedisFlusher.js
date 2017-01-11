require('dotenv').config();

var redis     = require('redis');
var logger    = require('log4js').getLogger('RedisFlusher');

var client = redis.createClient({
  host: process.env.REDIS_SERVER_ADDRESS,
  port: process.env.REDIS_SERVER_PORT,
});

client.flushdb(function (err, succeeded) {
  if (err) {
    logger.error('Something went wrong when flushing redis db: ' + err);
  }
  logger.info('Finished flushing redis: ' + succeeded);
  process.exit(0);
});
