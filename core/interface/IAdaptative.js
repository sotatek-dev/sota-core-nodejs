var logger = log4js.getLogger('IAdaptative');

module.exports = {

  getAdapterForSelect: function() {
    throw new Error('I must be implemented in derived class');
  },

  getFromClause: function() {
    throw new Error('I must be implemented in derived class');
  },

  getAlias: function() {
    return this._alias || this.tableName;
  },

  find: function(options, callback) {
    var self = this;
    var adapter = self.getAdapterForSelect();
    adapter.select(self.getFromClause(), options, callback);
  },

  count: function(options, callback) {
    var self = this;
    var adapter = self.getAdapterForSelect();
    adapter.count(self.getFromClause(), options, callback);
  },

  countEx: function(options, callback) {
    var self = this;
    var adapter = self.getAdapterForSelect();
    adapter.count(self.getFromClause(), options, callback);
  },

  sum: function(column, options, callback) {
    var self = this;
    var adapter = self.getAdapterForSelect();
    adapter.sum(self.getFromClause(), column, options, callback);
  },

  sumEx: function(column, options, callback) {
    var self = this;
    var adapter = self.getAdapterForSelect();
    options.isExAggregation = true;
    adapter.sum(self.getFromClause(), column, options, callback);
  },

  existed: function(options, callback) {
    var self = this;
    var adapter = self.getAdapterForSelect();
    adapter.existed(self.getFromClause(), options, callback);
  },

  countGroupBy: function(groupCols, options, callback) {
    if (typeof groupCols === 'string') {
      groupCols = [groupCols];
    }

    var adapter = this.getAdapterForSelect(),
        self = this;
    adapter.countGroupBy(this.getFromClause(), groupCols, options, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, self.constructCollection(ret));
    });
  },

  sumGroupBy: function(column, options, callback) {
    var adapter = this.getAdapterForSelect(),
        self = this;
    adapter.sumGroupBy(this.getFromClause(), column, options, function(err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, self.constructCollection(ret));
    });
  },

  $constructCollection: function(data) {
    if (!_.isArray(data)) {
      logger.error('constructCollection: invalid parameters data=' + util.inspect(data));
      return null;
    }

    var self = this,
        result = [];
    _.forEach(data, function(e) {
      result.push(self._convertOneObjectToCamelCase(e));
    });

    return result;
  },

  $_convertOneObjectToCamelCase: function(data) {
    if (!_.isObject(data)) {
      logger.error('_convertOneObjectToCamelCase: invalid parameters data=' + util.inspect(data));
      return null;
    }

    var result = {};
    for (var p in data) {
      result[Utils.convertToCamelCase(p)] = data[p];
    }

    return result;
  },

};
