/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
const Utils       = require('../../util/Utils');
const Const       = require('../../common/Const');
const BaseCache   = require('./BaseCache');

'use strict';

const _localData = {};
const _localMeta = {};

class LocalCache extends BaseCache {

  setAsync (key, value, meta, callback) {
    if (typeof meta === 'function') {
      callback = meta;
    }

    this.setSync(key, value, meta);
    return callback(null, value);
  }

  getAsync (key, callback) {
    return callback(null, this.getSync(key));
  }

  remove (key, callback) {
    this.removeSync(key);
    callback(null, true);
  }

  setSync (key, value, meta) {
    if (typeof meta === 'object') {
      _localMeta[key] = {
        expiredAt: Utils.now() + (meta.ttl || Const.DEFAULT_CACHE_TTL)
      };
    }

    _localData[key] = value;

    return this;
  }

  getSync (key) {
    const now = Utils.now();
    const meta = _localMeta[key];
    const data = _localData[key];

    // If cache is expired
    if (meta && meta.expiredAt && meta.expiredAt < now) {
      delete _localData[key];
      delete _localMeta[key];
      return null;
    }

    return data || null;
  }

  removeSync (key) {
    delete _localData[key];
    delete _localMeta[key];

    return this;
  }

}

module.exports = new LocalCache();
