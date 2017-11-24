module.exports = function (_) {
  if (!_) {
    return;
  }

  _.mixin({
    sortKeysBy: function (obj, comparator) {
      var keys = _.sortBy(_.keys(obj), function (key) {
        return comparator ? comparator(obj[key], key) : key;
      });

      return _.zipObject(keys, _.map(keys, function (key) {
        return obj[key];
      }));
    }
  });
};
