/* eslint no-multi-spaces: ["error", { exceptions: { "VariableDeclarator": true } }] */
var _         = require('lodash');
var util      = require('util');
var Utils     = require('../util/Utils');
var logger    = log4js.getLogger('IAdaptative');

module.exports = {

  getAdapterForSelect: function () {
    throw new Error('I must be implemented in derived class');
  },

  getFromClause: function () {
    throw new Error('I must be implemented in derived class');
  },

  getAlias: function () {
    return this._alias || this.tableName;
  },

  find: function (options, callback) {
    var self = this;
    var adapter = self.getAdapterForSelect();
    adapter.select(self.getFromClause(), options, function (err, ret) {
      if (err) {
        return callback(err);
      }

      callback(null, self.constructCollection(ret));
    });
  },

  count: function (options, callback) {
    var self = this;
    var adapter = self.getAdapterForSelect();
    adapter.count(self.getFromClause(), options, callback);
  },

  countEx: function (options, callback) {
    var self = this;
    var adapter = self.getAdapterForSelect();
    adapter.count(self.getFromClause(), options, callback);
  },

  sum: function (column, options, callback) {
    var self = this;
    var adapter = self.getAdapterForSelect();
    adapter.sum(self.getFromClause(), column, options, callback);
  },

  sumEx: function (column, options, callback) {
    var self = this;
    var adapter = self.getAdapterForSelect();
    options.isExAggregation = true;
    adapter.sum(self.getFromClause(), column, options, callback);
  },

  existed: function (options, callback) {
    var self = this;
    var adapter = self.getAdapterForSelect();
    adapter.existed(self.getFromClause(), options, callback);
  },

  countGroupBy: function (groupCols, options, callback) {
    if (typeof groupCols === 'string') {
      groupCols = [groupCols];
    }

    var self = this;
    var adapter = this.getAdapterForSelect();

    adapter.countGroupBy(this.getFromClause(), groupCols, options, function (err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, self.constructCollection(ret));
    });
  },

  countColumnGroupBy: function (groupCols, column, options, callback) {
    if (typeof groupCols === 'string') {
      groupCols = [groupCols];
    }

    var self = this;
    var adapter = this.getAdapterForSelect();

    adapter.countColumnGroupBy(this.getFromClause(), groupCols, column, options, function (err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, self.constructCollection(ret));
    });
  },

  sumGroupBy: function (column, options, callback) {
    var self = this;
    var adapter = this.getAdapterForSelect();

    adapter.sumGroupBy(this.getFromClause(), column, options, function (err, ret) {
      if (err) {
        callback(err);
        return;
      }

      callback(null, self.constructCollection(ret));
    });
  },

  $constructCollection: function (data) {
    if (!_.isArray(data)) {
      logger.error('constructCollection: invalid parameters data=' + util.inspect(data));
      return null;
    }

    var self = this;
    var result = [];

    _.forEach(data, function (e) {
      result.push(self._convertOneObjectToCamelCase(e));
    });

    // Some hack to make fan an subscription compatible with old client
    // TODO: remove this later
    if (self._model) {
      if (self._model.tableName === 'fan') {
        result = _.map(result, function (e) {
          e.userId = e.idolId;
          e.fanUid = e.fanId;
          return e;
        });
      } else if (self._model.tableName === 'subscription') {
        result = _.map(result, function (e) {
          e.userId = e.fanId;
          return e;
        });
      }
    }

    return result;
  },

  $_convertOneObjectToCamelCase: function (data) {
    if (!_.isObject(data)) {
      logger.error('_convertOneObjectToCamelCase: invalid parameters data=' + util.inspect(data));
      return null;
    }

    var result = {};
    for (var p in data) {
      result[Utils.convertToCamelCase(p)] = data[p];
    }

    return result;
  }

};
