var BaseCache = require('./BaseCache');
var redis     = require('redis');
var logger    = require('log4js').getLogger('RedisCache');

'use strict';

var client = redis.createClient({
      host: process.env.REDIS_SERVER_ADDRESS,
      port: process.env.REDIS_SERVER_PORT,
    });

client.on('error', function(err) {
  logger.error('On redis error: ' + err);
});

class RedisCache extends BaseCache {

  set(key, value, meta, callback) {
    if (typeof meta === 'function') {
      callback = meta;
      meta = null;
    }

    client.set(key, value, callback);
    if (meta && meta.ttl) {
      let ttlInSeconds = ~~(meta.ttl / 1000);
      client.expire(key, ttlInSeconds);
    }
  }

  get(key, callback) {
    client.get(key, callback);
  }

  remove(key, callback) {
    this.removeSync(key);
    callback(null, true);
  }

  removeSync(key) {
    client.del(key);
  }

}

module.exports = new RedisCache();
