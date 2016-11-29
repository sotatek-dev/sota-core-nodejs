'use strict'

class BaseCache {

  set(key, value, meta, callback) {
    throw new Error('Implement me.');
  }

  get(key, callback) {
    throw new Error('Implement me.');
  }

  remove(key, callback) {
    throw new Error('Implement me.');
  }

  setSync(key, value, meta) {
    throw new Error('Implement me.');
  }

  getSync(key) {
    throw new Error('Implement me.');
  }

  removeSync(key, callback) {
    throw new Error('Implement me.');
  }

}

module.exports = BaseCache;
