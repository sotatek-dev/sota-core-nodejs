'use strict';

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

  setObject(key, value, meta, callback) {
    this.set(key, JSON.stringify(value), meta, callback);
  }

  getObject(key, callback) {
    this.get(key, function(err, ret) {
      if (err) {
        return callback(err);
      }

      if (_.isNil(ret)) {
        return callback(null, null);
      }

      var result = null;
      try {
        result = JSON.parse(ret);
      } catch (e) {
        logger.error('Invalid cached object for key: ' + key);
      }

      return callback(null, result);

    });
  }

}

module.exports = BaseCache;
