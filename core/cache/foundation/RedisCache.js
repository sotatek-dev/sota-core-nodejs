/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _               = require('lodash');
var redis           = require('redis');
var BaseCache       = require('./BaseCache');
var logger          = log4js.getLogger('RedisCache');

'use strict';

var client = redis.createClient({
  host: process.env.REDIS_SERVER_ADDRESS,
  port: process.env.REDIS_SERVER_PORT
});

client.on('error', function (err) {
  logger.error('On redis error: ' + err);
});

class RedisCache extends BaseCache {

  setAsync (key, value, meta, callback) {
    if (typeof meta === 'function') {
      callback = meta;
      meta = null;
    }

    client.set(key, value, callback);

    var ttl = Const.DEFAULT_CACHE_TTL;
    if (meta && meta.ttl) {
      ttl = meta.ttl;
    }

    client.expire(key, ~~(ttl / 1000));
  }

  hmset (key, obj, meta, callback) {
    if (typeof meta === 'function') {
      callback = meta;
      meta = null;
    }

    var args = [key];
    for (let prop in obj) {
      let value = obj[prop];
      if (_.isNil(value)) {
        continue;
      }

      args.push(prop);
      args.push(value);
    }

    args.push(callback);
    client.hmset.apply(client, args);

    var ttl = Const.DEFAULT_CACHE_TTL;
    if (meta && meta.ttl) {
      ttl = meta.ttl;
    }

    client.expire(key, ~~(ttl / 1000));
  }

  hgetall (key, callback) {
    client.hgetall(key, callback);
  }

  getAsync (key, callback) {
    client.get(key, callback);
  }

  incrby (key, value, callback) {
    client.incrby(key, value, callback);
  }

  incr (key, callback) {
    client.incr(key, callback);
  }

  remove (key, callback) {
    client.del(key, callback);
  }

  removeSync (key) {
    client.del(key);
  }

  getClient () {
    return client;
  }

}

module.exports = new RedisCache();
