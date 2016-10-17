/**
 * Very simple though.
 * TODO: improve this
 */
var _cache = {};

module.exports.set = function(key, value) {
  _cache[key] = value;
};

module.exports.get = function(key) {
  return _cache[key];
};
